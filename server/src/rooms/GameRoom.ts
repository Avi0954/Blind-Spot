import { Room, Client } from "@colyseus/core";
import crypto from "node:crypto";
import { GameState, GameStatus, Player, Vector3 } from "@blind-spot/shared";
import { InteractionValidator } from "../game/interaction/InteractionValidator";
import { InteractionHandlers } from "../game/interaction/InteractionHandlers";
import { InteractionContext, InteractionResult } from "../game/interaction/InteractionContext";
import { PuzzleManager } from "../game/puzzle/PuzzleManager";
import { PerceptionManager } from "../game/perception/PerceptionManager";
import { GameStateMachine } from "../game/state/GameStateMachine";
import { RoleManager } from "../game/roles/RoleManager";
import { PanicManager } from "../game/panic/PanicManager";
import { RuleEngine } from "../game/rules/RuleEngine";
import { GameModeRegistry } from "../game/modes/GameModeRegistry";
import { DifferentRealityMode } from "../game/modes/impl/DifferentRealityMode";
import { TeamRolesMode } from "../game/modes/impl/TeamRolesMode";
import { PanicMode } from "../game/modes/impl/PanicMode";
import { GameModeId, ModeContext } from "../game/rules/RuleTypes";
import { LevelManager } from "../game/levels/LevelManager";
import { CommunicationManager } from "../game/communication/CommunicationManager";

export class GameRoom extends Room<GameState> {
  maxClients = 6;
  puzzleManager!: PuzzleManager;
  perceptionManager!: PerceptionManager;
  stateMachine!: GameStateMachine;
  panicManager!: PanicManager;
  ruleEngine!: RuleEngine;
  modeRegistry!: GameModeRegistry;
  levelManager!: LevelManager;
  communicationManager!: CommunicationManager;

  onCreate(_options: any) {
    this.setState(new GameState());
    
    this.puzzleManager = new PuzzleManager(this);
    this.perceptionManager = new PerceptionManager(this);
    this.stateMachine = new GameStateMachine(this);
    this.panicManager = new PanicManager(this);
    this.communicationManager = new CommunicationManager(this);
    
    // Set up server tick for panic mode
    this.setSimulationInterval((_deltaTime) => {
      this.panicManager.update();
      this.communicationManager.update();
    }, 100); // 10hz simulation tick

    // Set up Rule Engine and Modes
    this.ruleEngine = new RuleEngine();
    this.modeRegistry = new GameModeRegistry();
    
    this.modeRegistry.register(new DifferentRealityMode());
    this.modeRegistry.register(new TeamRolesMode());
    this.modeRegistry.register(new PanicMode());

    // Initialize LevelManager
    this.levelManager = new LevelManager(this);

    // Initial state
    this.state.roomId = this.roomId;
    this.state.createdAt = Date.now();
    this.state.seed = crypto.randomBytes(16).toString("hex");
    this.state.seedVersion = 1;
    this.state.seedAlgorithm = "mulberry32";
    
    // Load default level
    this.levelManager.load("level-01");

    this.onMessage("ready", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.ready = !!message.ready;
        
        // If we are in LOBBY, check if we can start
        if (this.stateMachine.getState() === GameStatus.LOBBY) {
           this.stateMachine.transition(GameStatus.STARTING, "All players ready");
        }
      }
    });

    this.onMessage("change_mode", (client, message) => {
      if (client.sessionId === this.state.hostId && this.state.gameStatus === "waiting") {
        // Validate game mode
        const validModes = ["Different Reality", "Team Roles", "Panic"];
        if (validModes.includes(message.gameMode)) {
          this.state.gameMode = message.gameMode;
          console.log("Mode changed to", message.gameMode);
        }
      } else {
        client.send("error", { message: "Only the host can change the game mode." });
      }
    });

    this.onMessage("player_move", (client, data) => {
      if (this.state.gameStatus !== "playing") return;
      
      const player = this.state.players.get(client.sessionId);
      if (player) {
        if (data.position) {
          player.position.x = data.position.x;
          player.position.y = data.position.y;
          player.position.z = data.position.z;
        }
        if (data.rotation) {
          player.rotation.x = data.rotation.x || 0;
          player.rotation.y = data.rotation.y || 0;
          player.rotation.z = data.rotation.z || 0;
        }
      }
    });



    this.onMessage("interact_request", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      const interactable = this.state.interactables.get(data.objectId);

      if (!player || !interactable) return;

      const context: InteractionContext = { 
        player, 
        interactable,
        room: this,
        state: this.state,
        timestamp: Date.now(),
        payload: data.payload
      };
      
      const result = InteractionValidator.validate(context);
      if (result === InteractionResult.SUCCESS) {
        InteractionHandlers.handle(context);
        // Re-evaluate perception in case the interaction changed world state that affects visibility
        this.perceptionManager.recalculateAll();
      } else {
        console.warn(`[Interaction] Validation failed: ${result}`);
        client.send("interaction_error", { objectId: data.objectId, reason: result });
      }
    });

    this.onMessage("start_game", () => {
      // Intent to start game
      if (this.stateMachine.getState() === GameStatus.LOBBY) {
         // Force ready all players if host clicks start
         this.state.players.forEach(p => p.ready = true);
         
         // Assign Roles
         RoleManager.assignRoles(Array.from(this.state.players.values()));

         this.stateMachine.transition(GameStatus.STARTING, "Host requested start");
      }
    });

    this.onMessage("rematch", () => {
      if (this.stateMachine.getState() === GameStatus.ENDING) {
        this.stateMachine.transition(GameStatus.LOBBY, "Rematch requested");
      }
    });
  }

  public resetMatchState() {
    this.state.players.forEach(p => p.ready = false);
    this.levelManager.load(this.state.activeLevelId || "level-01");
    this.state.startedAt = 0;
  }

  public initializeModes(modeIds: GameModeId[]) {
    this.ruleEngine.clear();
    const activeModes = this.modeRegistry.resolve(modeIds);
    const modeContext: ModeContext = {
      room: this,
      gameState: this.state
    };

    for (const mode of activeModes) {
      if (mode.initialize) mode.initialize(modeContext);
      
      const rules = mode.registerRules(modeContext);
      if (rules.perception) this.ruleEngine.registerAll(rules.perception);
      if (rules.roles) this.ruleEngine.registerAll(rules.roles);
      if (rules.interactions) this.ruleEngine.registerAll(rules.interactions);
      if (rules.timers) this.ruleEngine.registerAll(rules.timers);
      if (rules.puzzles) this.ruleEngine.registerAll(rules.puzzles);
      if (rules.environment) this.ruleEngine.registerAll(rules.environment);
    }
  }

  public initializeWorld() {
    this.levelManager.load(this.state.activeLevelId || "level-01");
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined room", this.roomId);
    
    if (this.state.players.size === 0) {
      this.state.hostId = client.sessionId;
    }

    const player = new Player();
    player.playerId = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;
    player.position = new Vector3(0, 0, 0);
    player.rotation = new Vector3(0, 0, 0);
    player.connected = true;
    player.ready = false;

    this.state.players.set(client.sessionId, player);

    this.perceptionManager.initializePlayer(client.sessionId);
    
    // Attempt transition to LOBBY if waiting
    if (this.stateMachine.getState() === GameStatus.WAITING) {
      this.stateMachine.transition(GameStatus.LOBBY, "Required players joined");
    }

    this.perceptionManager.recalculateAll(); // recalculate for everyone when someone joins to trigger the test rule split

    this.broadcast("player_join", { playerId: player.playerId, name: player.name });
  }

  async onLeave(client: Client) {
    console.log(client.sessionId, "left room", this.roomId);
    
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = false;
      this.broadcast("player_leave", { playerId: player.playerId, name: player.name });
      
      this.state.players.delete(client.sessionId);
      this.perceptionManager.removePlayer(client.sessionId);
      this.communicationManager.removePlayer(client.sessionId);
      this.perceptionManager.recalculateAll();
      
      // If room is empty, close it
      if (this.state.players.size === 0) {
        this.disconnect();
      } else {
        // If the host left, reassign host
        if (this.state.hostId === client.sessionId) {
          const nextPlayerId = Array.from(this.state.players.keys())[0];
          if (nextPlayerId) {
            this.state.hostId = nextPlayerId;
          }
        }
        
        // Check if we dropped below minimum players
        if (this.state.players.size < 2) {
          if (this.stateMachine.getState() === GameStatus.PLAYING) {
             this.stateMachine.transition(GameStatus.WAITING, "Not enough players");
          } else if (this.stateMachine.getState() === GameStatus.LOBBY) {
             this.stateMachine.transition(GameStatus.WAITING, "Not enough players");
          }
        }
      }
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}

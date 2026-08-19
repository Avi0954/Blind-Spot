import { Room, Client } from "@colyseus/core";
import { GameState, GameStatus, Player, InteractableState, Vector3 } from "@blind-spot/shared";
import { InteractionValidator } from "../game/interaction/InteractionValidator";
import { InteractionHandlers } from "../game/interaction/InteractionHandlers";
import { InteractionContext, InteractionResult } from "../game/interaction/InteractionContext";
import { PuzzleManager } from "../game/puzzle/PuzzleManager";
import { PerceptionManager } from "../game/perception/PerceptionManager";
import { GameStateMachine } from "../game/state/GameStateMachine";
import { RoleManager } from "../game/roles/RoleManager";

export class GameRoom extends Room<GameState> {
  maxClients = 6;
  puzzleManager!: PuzzleManager;
  perceptionManager!: PerceptionManager;
  stateMachine!: GameStateMachine;

  onCreate(options: any) {
    this.setState(new GameState());
    
    this.puzzleManager = new PuzzleManager(this);
    this.perceptionManager = new PerceptionManager(this);
    this.stateMachine = new GameStateMachine(this);

    this.perceptionManager.addRule({
      evaluate: (playerId: string, object: InteractableState, room: GameRoom) => {
        // Find player roles
        const players = Array.from(room.state.players.keys());
        const isPlayerA = players[0] === playerId;
        
        // Door and keypad are visible to everyone
        if (object.id === "door_01" || object.id === "keypad_01") return true;

        // Player A sees symbol clue
        if (isPlayerA && object.id === "symbol_clue_01") return true;

        // Player B sees number clue
        if (!isPlayerA && object.id === "number_clue_01") return true;

        // In single player testing, allow seeing both
        if (players.length <= 1) return true;

        return false;
      }
    });

    this.state.roomId = this.roomId;
    this.state.createdAt = Date.now();
    this.state.gameMode = options.gameMode || "Different Reality";

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

    // Seed initial interactables
    this.seedInteractables();

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
    this.state.interactables.clear();
    this.state.puzzles.clear();
    this.state.startedAt = 0;
  }

  public initializeWorld() {
    this.seedInteractables();
    this.perceptionManager.recalculateAll();
  }

  private seedInteractables() {
    if (this.state.interactables.size > 0) return;

    // Door
    const door = new InteractableState();
    door.id = "door_01";
    door.type = "door";
    door.state = "locked"; 
    door.position = new Vector3(0, 0, -5);
    door.interactionRange = 3.0;
    door.enabled = false; 
    this.state.interactables.set(door.id, door);

    // Terminal A (Fake)
    const terminalA = new InteractableState();
    terminalA.id = "terminal_a";
    terminalA.type = "keypad";
    terminalA.state = "idle";
    terminalA.position = new Vector3(-4.9, 1.5, -3); // Left wall
    terminalA.interactionRange = 2.0;
    terminalA.requiredAbility = "OPERATE_MACHINE";
    this.state.interactables.set(terminalA.id, terminalA);

    // Terminal B (Correct)
    const terminalB = new InteractableState();
    terminalB.id = "terminal_b";
    terminalB.type = "keypad";
    terminalB.state = "idle";
    terminalB.position = new Vector3(0, 1.5, -4.9); // Back wall near door
    terminalB.interactionRange = 2.0;
    terminalB.requiredAbility = "OPERATE_MACHINE";
    this.state.interactables.set(terminalB.id, terminalB);

    // Terminal C (Fake)
    const terminalC = new InteractableState();
    terminalC.id = "terminal_c";
    terminalC.type = "keypad";
    terminalC.state = "idle";
    terminalC.position = new Vector3(4.9, 1.5, -3); // Right wall
    terminalC.interactionRange = 2.0;
    terminalC.requiredAbility = "OPERATE_MACHINE";
    this.state.interactables.set(terminalC.id, terminalC);

    // Observer Clue (Hidden Symbol Panel)
    const symbolClue = new InteractableState();
    symbolClue.id = "symbol_panel_01";
    symbolClue.type = "clue";
    symbolClue.state = "idle";
    symbolClue.position = new Vector3(-4.9, 1.5, 0); // On left wall
    symbolClue.interactionRange = 3.0;
    symbolClue.requiredPerception = "SEE_HIDDEN_CLUE";
    symbolClue.metadata = JSON.stringify({ clue: "▲  ○  □  ○", title: "HIDDEN SYMBOLS" });
    this.state.interactables.set(symbolClue.id, symbolClue);

    // Decoder Clue (Translation Panel)
    const decoderClue = new InteractableState();
    decoderClue.id = "decoder_panel_01";
    decoderClue.type = "clue";
    decoderClue.state = "idle";
    decoderClue.position = new Vector3(4.9, 1.5, 0); // On right wall
    decoderClue.interactionRange = 3.0;
    decoderClue.requiredPerception = "DECODE_SYMBOL";
    decoderClue.metadata = JSON.stringify({ clue: "▲=8  ○=3  □=6", title: "TRANSLATION KEY" });
    this.state.interactables.set(decoderClue.id, decoderClue);

    // Navigator Clue (Map/Routing Panel)
    const navigatorClue = new InteractableState();
    navigatorClue.id = "navigator_map_01";
    navigatorClue.type = "clue";
    navigatorClue.state = "idle";
    navigatorClue.position = new Vector3(0, 1.5, 4.9); // On back wall (spawn area)
    navigatorClue.interactionRange = 3.0;
    navigatorClue.requiredPerception = "SEE_HIDDEN_ROUTE";
    navigatorClue.metadata = JSON.stringify({ clue: "POWER RELAY IS ROUTED TO TERMINAL B ONLY", title: "FACILITY MAP" });
    this.state.interactables.set(navigatorClue.id, navigatorClue);

    // MVP Puzzle 01 Configuration
    this.puzzleManager.loadPuzzles([
      {
        id: "reality_puzzle_01",
        type: "multiplayer",
        configuration: {
          playersRequired: 2,
          targetObject: "terminal_b"
        },
        solution: {
          sequence: [8, 3, 6, 3]
        }
      }
    ]);
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

import { Room, Client } from "@colyseus/core";
import { GameState, GameStatus, Player, InteractableState, Vector3 } from "@blind-spot/shared";
import { InteractionValidator } from "../game/interaction/InteractionValidator";
import { InteractionHandlers } from "../game/interaction/InteractionHandlers";
import { InteractionContext, InteractionResult } from "../game/interaction/InteractionContext";
import { PuzzleManager } from "../game/puzzle/PuzzleManager";
import { PerceptionManager } from "../game/perception/PerceptionManager";
import { GameStateMachine } from "../game/state/GameStateMachine";

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
         // Optionally force ready all players if host clicks start
         this.state.players.forEach(p => p.ready = true);
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
    door.state = "locked"; // Starts locked!
    door.position = new Vector3(0, 0, -5);
    door.interactionRange = 3.0;
    door.enabled = false; // Cannot be opened until puzzle solves
    this.state.interactables.set(door.id, door);

    // Keypad (Code panel)
    const keypad = new InteractableState();
    keypad.id = "keypad_01";
    keypad.type = "keypad";
    keypad.state = "idle";
    keypad.position = new Vector3(-1, 1.5, -4.9); // Near the door
    keypad.interactionRange = 2.0;
    this.state.interactables.set(keypad.id, keypad);

    // Symbol Clue (Player A)
    const symbolClue = new InteractableState();
    symbolClue.id = "symbol_clue_01";
    symbolClue.type = "clue";
    symbolClue.state = "idle";
    symbolClue.position = new Vector3(-4.9, 1.5, 0); // On left wall
    symbolClue.interactionRange = 3.0;
    symbolClue.metadata = JSON.stringify({ clue: "▲  ○  □  ▲", title: "SYMBOL PANEL" });
    this.state.interactables.set(symbolClue.id, symbolClue);

    // Number Clue (Player B)
    const numberClue = new InteractableState();
    numberClue.id = "number_clue_01";
    numberClue.type = "clue";
    numberClue.state = "idle";
    numberClue.position = new Vector3(4.9, 1.5, 0); // On right wall
    numberClue.interactionRange = 3.0;
    numberClue.metadata = JSON.stringify({ clue: "3  1  4  3", title: "CODE PANEL" });
    this.state.interactables.set(numberClue.id, numberClue);

    // MVP Puzzle 01 Configuration
    this.puzzleManager.loadPuzzles([
      {
        id: "reality_puzzle_01",
        type: "multiplayer",
        configuration: {
          playersRequired: 2
        },
        solution: {
          sequence: [3, 1, 4, 3]
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

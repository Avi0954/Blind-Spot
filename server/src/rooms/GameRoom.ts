import { Room, Client } from "@colyseus/core";
import { GameState, Player, InteractableState, Vector3 } from "@blind-spot/shared";
import { InteractionValidator } from "../game/interaction/InteractionValidator";
import { InteractionHandlers } from "../game/interaction/InteractionHandlers";
import { InteractionResult } from "../game/interaction/InteractionContext";

export class GameRoom extends Room<GameState> {
  maxClients = 6;

  onCreate(options: any) {
    this.setState(new GameState());
    
    this.state.roomId = this.roomId;
    this.state.createdAt = Date.now();
    this.state.gameMode = options.gameMode || "Different Reality";

    this.onMessage("ready", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.ready = !!message.ready;
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

      const context = { 
        player, 
        interactable, 
        room: this,
        state: this.state,
        timestamp: Date.now()
      };
      
      const result = InteractionValidator.validate(context);
      if (result === InteractionResult.SUCCESS) {
        InteractionHandlers.handle(context);
      } else {
        client.send("interaction_error", { objectId: data.objectId, reason: result });
      }
    });

    this.onMessage("start_game", (client) => {
      if (client.sessionId !== this.state.hostId) {
        return client.send("error", { message: "Only the host can start the game." });
      }

      if (this.state.players.size < 2) {
        return client.send("error", { message: "Minimum 2 players required to start." });
      }

      let allReady = true;
      this.state.players.forEach((player) => {
        if (!player.ready) allReady = false;
      });

      if (!allReady) {
        return client.send("error", { message: "All players must be ready." });
      }

      if (this.state.gameStatus === "waiting") {
        this.state.gameStatus = "playing";
        this.state.startedAt = Date.now();
        this.broadcast("game_started");
      }
    });
  }

  private seedInteractables() {
    if (this.state.interactables.size > 0) return;

    // Door
    const door = new InteractableState();
    door.id = "door_01";
    door.type = "door";
    door.state = "closed";
    door.position = new Vector3(0, 0, -5);
    door.interactionRange = 3.0;
    this.state.interactables.set(door.id, door);

    // Key
    const key = new InteractableState();
    key.id = "key_01";
    key.type = "key";
    key.state = "idle";
    key.position = new Vector3(2, 1.1, 0); // On the table
    key.interactionRange = 2.0;
    this.state.interactables.set(key.id, key);

    // Lever
    const lever = new InteractableState();
    lever.id = "lever_01";
    lever.type = "lever";
    lever.state = "off";
    lever.position = new Vector3(-4.9, 1.5, 2); // Control panel area
    lever.interactionRange = 2.0;
    this.state.interactables.set(lever.id, lever);
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

    this.broadcast("player_join", { playerId: player.playerId, name: player.name });
  }

  async onLeave(client: Client) {
    console.log(client.sessionId, "left room", this.roomId);
    
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = false;
      this.broadcast("player_leave", { playerId: player.playerId, name: player.name });
      
      this.state.players.delete(client.sessionId);
      
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
        
        // Pause game if we drop below minimum players during active play
        if (this.state.players.size < 2 && this.state.gameStatus === "playing") {
          this.state.gameStatus = "waiting";
          this.broadcast("game_paused", { reason: "Not enough players" });
        }
      }
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}

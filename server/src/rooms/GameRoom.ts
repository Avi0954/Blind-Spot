import { Room, Client } from "@colyseus/core";
import { GameState, Player } from "@blind-spot/shared";

export class GameRoom extends Room<GameState> {
  maxClients = 6;

  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("interact", (client, message) => {
      // handle interaction
      console.log(`Player ${client.sessionId} interacted with`, message);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.sessionId = client.sessionId;
    player.id = options.id || client.sessionId;
    this.state.players.set(client.sessionId, player);

    if (this.state.players.size >= 2) {
      this.state.status = "playing";
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
    if (this.state.players.size < 2) {
      this.state.status = "waiting";
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}

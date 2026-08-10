import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") sessionId: string = "";
  @type("string") role: string = "observer";
}

export class GameState extends Schema {
  @type({ map: Player }) players = new Map<string, Player>();
  @type("string") status: string = "waiting"; // waiting, playing, finished
}

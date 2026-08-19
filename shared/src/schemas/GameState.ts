import { Schema, type, MapSchema } from "@colyseus/schema";
import { Player } from "./Player";
import { InteractableState } from "./InteractableState";

export class GameState extends Schema {
  @type("string") roomId: string = "";
  @type("string") hostId: string = "";
  @type("string") gameStatus: string = "waiting"; // waiting, playing, finished
  @type("string") gameMode: string = "standard";
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: InteractableState }) interactables = new MapSchema<InteractableState>();
  @type("number") createdAt: number = Date.now();
  @type("number") startedAt: number = 0;
}

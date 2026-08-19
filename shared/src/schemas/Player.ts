import { Schema, type } from "@colyseus/schema";
import { Vector3 } from "./Vector3";

export class Player extends Schema {
  @type("string") playerId: string = "";
  @type("string") name: string = "Anonymous";
  @type(Vector3) position: Vector3 = new Vector3();
  @type(Vector3) rotation: Vector3 = new Vector3();
  @type("boolean") ready: boolean = false;
  @type("boolean") connected: boolean = true;
}

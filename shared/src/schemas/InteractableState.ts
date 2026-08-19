import { Schema, type } from "@colyseus/schema";
import { Vector3 } from "./Vector3";

export class InteractableState extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = "button"; // door, lever, key, switch, terminal, etc.
  @type("string") state: string = "idle"; // idle, pressed, opening, closed, consumed
  @type(Vector3) position: Vector3 = new Vector3();
  @type("number") interactionRange: number = 2.0;
  @type("boolean") enabled: boolean = true;
  @type("string") metadata: string = "{}"; // JSON string for type-specific properties
  @type("string") requiredAbility: string = "";
  @type("string") requiredPerception: string = "";
  @type("string") panicConfig: string = "{}"; // JSON string for { disabledDuring: PanicPhase[] }
}

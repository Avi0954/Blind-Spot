import { Schema, type, MapSchema } from "@colyseus/schema";
import { InteractableState } from "./InteractableState";
import { PuzzleState } from "./PuzzleState";

export class ClientReality extends Schema {
  @type("string") playerId: string = "";

  // The visible subset of the true authoritative world
  @type({ map: InteractableState }) visibleInteractables = new MapSchema<InteractableState>();
  @type({ map: PuzzleState }) visiblePuzzles = new MapSchema<PuzzleState>();
}

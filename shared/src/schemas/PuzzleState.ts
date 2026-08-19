import { Schema, type } from "@colyseus/schema";

export class PuzzleState extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = "";
  @type("string") state: string = "active";
  @type("string") progress: string = "{}"; // JSON string for sanitized progress
  @type("boolean") completed: boolean = false;
}

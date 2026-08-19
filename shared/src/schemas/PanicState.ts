import { Schema, type } from "@colyseus/schema";

export enum PanicPhase {
  IDLE = "IDLE",
  NORMAL = "NORMAL",
  WARNING = "WARNING",
  UNSTABLE = "UNSTABLE",
  EMERGENCY = "EMERGENCY",
  VICTORY = "VICTORY",
  FAILURE = "FAILURE"
}

export class PanicState extends Schema {
  @type("boolean") active: boolean = false;
  @type("string") phase: string = PanicPhase.IDLE;
  
  @type("number") startedAt: number = 0;
  @type("number") endsAt: number = 0;
  
  // Phase Threshold Timestamps
  @type("number") warningAt: number = 0;
  @type("number") unstableAt: number = 0;
  @type("number") emergencyAt: number = 0;

  @type("boolean") completed: boolean = false;
  @type("boolean") failed: boolean = false;
}

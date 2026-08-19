import { Schema, type, MapSchema, filter } from "@colyseus/schema";
import { Player } from "./Player";
import { InteractableState } from "./InteractableState";
import { PuzzleState } from "./PuzzleState";
import { ClientReality } from "./ClientReality";
import { PanicState } from "./PanicState";

export enum GameStatus {
  WAITING = "WAITING",
  LOBBY = "LOBBY",
  STARTING = "STARTING",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  ENDING = "ENDING"
}

export class GameState extends Schema {
  @type("string") roomId: string = "";
  @type("string") hostId: string = "";
  @type("string") gameStatus: string = GameStatus.WAITING;
  @type("number") stateVersion: number = 0;
  @type("string") gameMode: string = "Different Reality";
  @type({ map: Player }) players = new MapSchema<Player>();
  
  // These are now SERVER ONLY. They lack @type and will NOT be synced over the network.
  interactables = new MapSchema<InteractableState>();
  puzzles = new MapSchema<PuzzleState>();

  // This is the sanitized, filtered view per client.
  @filter(function(client: any, value: ClientReality) {
    return client.sessionId === value.playerId;
  })
  @type({ map: ClientReality }) clientRealities = new MapSchema<ClientReality>();

  @type("number") createdAt: number = Date.now();
  @type("number") startedAt: number = 0;

  @type(PanicState) panic: PanicState = new PanicState();
}

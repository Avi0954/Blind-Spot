import { PuzzleState } from "@blind-spot/shared";

export abstract class Puzzle {
  id: string;
  type: string;
  configuration: any;
  solution: any;
  runtimeState: any;
  completed: boolean = false;

  constructor(id: string, type: string, configuration: any, solution: any) {
    this.id = id;
    this.type = type;
    this.configuration = configuration;
    this.solution = solution;
    this.runtimeState = {};
  }

  // Handle incoming events from the game engine (e.g., interaction.completed)
  abstract handleEvent(event: any): void;

  // Called to reset the puzzle state
  abstract reset(): void;

  // Generates the sanitized Colyseus state for the clients
  abstract getClientState(): PuzzleState;
}

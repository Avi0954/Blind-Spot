import { Puzzle } from "./Puzzle";
import { SequencePuzzle } from "./types/SequencePuzzle";
import { MultiplayerCodePuzzle } from "./types/MultiplayerCodePuzzle";

export class PuzzleRegistry {
  static create(id: string, type: string, configuration: any, solution: any): Puzzle {
    switch (type) {
      case "sequence":
        return new SequencePuzzle(id, type, configuration, solution);
      case "multiplayer":
        return new MultiplayerCodePuzzle(id, type, configuration, solution);
      // case "symbol": return new SymbolPuzzle(...);
      default:
        throw new Error(`Unknown puzzle type: ${type}`);
    }
  }
}

import { Puzzle } from "./Puzzle";
import { SequencePuzzle } from "./types/SequencePuzzle";

export class PuzzleRegistry {
  static create(id: string, type: string, configuration: any, solution: any): Puzzle {
    switch (type) {
      case "sequence":
        return new SequencePuzzle(id, type, configuration, solution);
      // case "number": return new NumberPuzzle(...);
      // case "symbol": return new SymbolPuzzle(...);
      default:
        throw new Error(`Unknown puzzle type: ${type}`);
    }
  }
}

import { GameRoom } from "../../rooms/GameRoom";
import { Puzzle } from "./Puzzle";
import { PuzzleRegistry } from "./PuzzleRegistry";

export class PuzzleManager {
  private room: GameRoom;
  private puzzles: Map<string, Puzzle> = new Map();

  constructor(room: GameRoom) {
    this.room = room;
  }

  loadPuzzles(puzzleConfigs: any[]) {
    for (const config of puzzleConfigs) {
      const puzzle = PuzzleRegistry.create(
        config.id,
        config.type,
        config.configuration,
        config.solution
      );
      this.puzzles.set(puzzle.id, puzzle);
      
      // Seed into Colyseus state
      this.syncPuzzleState(puzzle);
    }
    this.room.perceptionManager.recalculateAll();
  }

  handleEvent(event: any) {
    for (const puzzle of this.puzzles.values()) {
      if (!puzzle.completed) {
        const wasCompleted = puzzle.completed;
        puzzle.handleEvent(event);
        this.syncPuzzleState(puzzle);
        
        if (!wasCompleted && puzzle.completed) {
          // Puzzle just completed!
          if (puzzle.id === "reality_puzzle_01") {
            const door = this.room.state.interactables.get("door_01");
            if (door) {
              door.state = "opening"; // Physical door opens
            }
            this.room.state.gameStatus = "victory"; // Trigger victory UI
          }
        }
        
        this.room.perceptionManager.recalculateAll();
      }
    }
  }

  private syncPuzzleState(puzzle: Puzzle) {
    this.room.state.puzzles.set(puzzle.id, puzzle.getClientState());
  }
}

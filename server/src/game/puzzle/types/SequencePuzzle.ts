import { Puzzle } from "../Puzzle";
import { PuzzleState } from "@blind-spot/shared";

export class SequencePuzzle extends Puzzle {
  runtimeState: {
    currentIndex: number;
    failed: boolean;
  };

  constructor(id: string, type: string, configuration: any, solution: any) {
    super(id, type, configuration, solution);
    this.runtimeState = { currentIndex: 0, failed: false };
  }

  handleEvent(event: any): void {
    if (this.completed || this.runtimeState.failed) return;

    if (event.type === "interaction.completed") {
      const targetId = event.objectId;
      
      // Is this object part of our puzzle?
      if (!this.configuration.targets.includes(targetId)) return;

      const expectedTarget = this.solution.sequence[this.runtimeState.currentIndex];

      if (targetId === expectedTarget) {
        // Correct step
        this.runtimeState.currentIndex++;
        
        if (this.runtimeState.currentIndex >= this.solution.sequence.length) {
          this.completed = true;
          // Here we would emit a 'puzzle.completed' event to the PuzzleManager/GameRoom
          console.log(`[Puzzle] ${this.id} COMPLETED!`);
        }
      } else {
        // Incorrect step
        if (this.configuration.resetOnMistake) {
          console.log(`[Puzzle] ${this.id} Mistake made. Resetting.`);
          this.reset();
        } else {
          this.runtimeState.failed = true;
          console.log(`[Puzzle] ${this.id} FAILED!`);
        }
      }
    }
  }

  reset(): void {
    this.runtimeState.currentIndex = 0;
    this.runtimeState.failed = false;
    this.completed = false;
  }

  getClientState(): PuzzleState {
    const state = new PuzzleState();
    state.id = this.id;
    state.type = this.type;
    state.completed = this.completed;
    state.state = this.completed ? "completed" : (this.runtimeState.failed ? "failed" : "active");
    
    // Only expose safe progress
    state.progress = JSON.stringify({
      currentIndex: this.runtimeState.currentIndex,
      total: this.solution.sequence.length
    });
    
    return state;
  }
}

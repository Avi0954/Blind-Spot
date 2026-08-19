import { Puzzle } from "../Puzzle";
import { PuzzleState } from "@blind-spot/shared";

export class MultiplayerCodePuzzle extends Puzzle {
  runtimeState: {
    failed: boolean;
  };

  constructor(id: string, type: string, configuration: any, solution: any) {
    super(id, type, configuration, solution);
    this.runtimeState = { failed: false };
  }

  handleEvent(event: any): void {
    if (this.completed) return;

    if (event.type === "interaction.keypad_submit") {
      const payload = event.payload; // Should be { code: [number, number, number, number] }
      
      if (!payload || !Array.isArray(payload.code)) return;

      const submittedSequence = payload.code;
      const expectedSequence = this.solution.sequence;

      if (submittedSequence.length === expectedSequence.length &&
          submittedSequence.every((val: any, index: number) => val === expectedSequence[index])) {
        // Correct sequence!
        this.completed = true;
        this.runtimeState.failed = false;
        console.log(`[Puzzle] ${this.id} COMPLETED by correct sequence!`);
      } else {
        // Incorrect sequence
        this.runtimeState.failed = true;
        console.log(`[Puzzle] ${this.id} FAILED! Incorrect sequence.`);
      }
    }
  }

  reset(): void {
    this.runtimeState.failed = false;
    this.completed = false;
  }

  getClientState(): PuzzleState {
    const state = new PuzzleState();
    state.id = this.id;
    state.type = this.type;
    state.completed = this.completed;
    state.state = this.completed ? "completed" : (this.runtimeState.failed ? "failed" : "active");
    
    // We do not expose progress for keypad since it's a single submit
    state.progress = "{}";
    
    return state;
  }
}

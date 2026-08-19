import { PanicPhase, GameStatus } from "@blind-spot/shared";
import { GameRoom } from "../../rooms/GameRoom";

export class PanicManager {
  private room: GameRoom;

  constructor(room: GameRoom) {
    this.room = room;
  }

  public startPanic(durationMs: number = 180000) {
    const now = Date.now();
    const panic = this.room.state.panic;

    panic.active = true;
    panic.phase = PanicPhase.NORMAL;
    
    panic.startedAt = now;
    panic.endsAt = now + durationMs;
    
    // Thresholds:
    // WARNING at 02:00 remaining (120s)
    // UNSTABLE at 01:00 remaining (60s)
    // EMERGENCY at 00:30 remaining (30s)
    
    panic.warningAt = panic.endsAt - 120000;
    panic.unstableAt = panic.endsAt - 60000;
    panic.emergencyAt = panic.endsAt - 30000;
    
    panic.completed = false;
    panic.failed = false;

    console.log(`[PanicManager] Started panic. Ends in ${durationMs}ms`);
    this.room.broadcast("PANIC_STARTED", { startedAt: panic.startedAt, endsAt: panic.endsAt, durationMs });
  }

  public completePanic() {
    const panic = this.room.state.panic;
    if (!panic.active || panic.failed) return;

    panic.completed = true;
    panic.phase = PanicPhase.VICTORY;
    panic.active = false;
    
    console.log(`[PanicManager] Panic Completed. Victory!`);
    this.room.broadcast("PANIC_VICTORY", { completedAt: Date.now(), remainingMs: panic.endsAt - Date.now() });
  }

  public failPanic() {
    const panic = this.room.state.panic;
    if (!panic.active || panic.completed) return;

    panic.failed = true;
    panic.phase = PanicPhase.FAILURE;
    panic.active = false;
    
    console.log(`[PanicManager] Panic Failed. Time expired!`);
    
    // Atomically transition the puzzle manager as well
    for (const [id, puzzleState] of this.room.state.puzzles.entries()) {
      if (!puzzleState.completed) {
        puzzleState.state = "failed";
      }
    }
    
    this.room.broadcast("PANIC_FAILURE", { failedAt: Date.now(), reason: "TIME_EXPIRED" });
    
    // Transition the room state
    this.room.stateMachine.transition(GameStatus.FAILED, "Timer Expired");
  }

  public update() {
    const panic = this.room.state.panic;
    if (!panic.active || panic.completed || panic.failed) return;

    const now = Date.now();

    if (now >= panic.endsAt) {
      this.failPanic();
      return;
    }

    let newPhase = panic.phase;

    if (now >= panic.emergencyAt) {
      newPhase = PanicPhase.EMERGENCY;
    } else if (now >= panic.unstableAt) {
      newPhase = PanicPhase.UNSTABLE;
    } else if (now >= panic.warningAt) {
      newPhase = PanicPhase.WARNING;
    }

    if (newPhase !== panic.phase) {
      const previousPhase = panic.phase;
      panic.phase = newPhase;
      
      console.log(`[PanicManager] Phase changed: ${previousPhase} -> ${newPhase}`);
      this.room.broadcast("PANIC_PHASE_CHANGED", { previousPhase, phase: newPhase });
      
      // Re-evaluate perception in case environmental changes affect visibility
      this.room.perceptionManager.recalculateAll();
    }
  }
}

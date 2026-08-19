import { GameRoom } from "../../rooms/GameRoom";
import { GameStatus } from "@blind-spot/shared";

export class GameStateMachine {
  private room: GameRoom;

  constructor(room: GameRoom) {
    this.room = room;
  }

  public getState(): GameStatus {
    return this.room.state.gameStatus as GameStatus;
  }

  public canTransition(targetState: GameStatus): boolean {
    const currentState = this.getState();
    const players = Array.from(this.room.state.players.values());

    switch (currentState) {
      case GameStatus.WAITING:
        return targetState === GameStatus.LOBBY && players.length >= 2;
        
      case GameStatus.LOBBY:
        // Transition to STARTING if all players are ready and we have required count
        if (targetState === GameStatus.STARTING) {
          return players.length >= 2 && players.every(p => p.ready);
        }
        // If a player leaves and drops below minimum, we could theoretically go back to WAITING, 
        // but for MVP, let's keep it simple.
        if (targetState === GameStatus.WAITING) {
           return players.length < 2;
        }
        return false;

      case GameStatus.STARTING:
        // STARTING automatically goes to PLAYING after initialization and countdown
        return targetState === GameStatus.PLAYING;

      case GameStatus.PLAYING:
        if (targetState === GameStatus.PAUSED) return true; // Server pause request
        if (targetState === GameStatus.COMPLETED) return true; // Victory condition
        if (targetState === GameStatus.FAILED) return true; // Failure condition
        if (targetState === GameStatus.WAITING) return players.length < 2; // Abort if someone leaves
        return false;

      case GameStatus.PAUSED:
        return targetState === GameStatus.PLAYING; // Server resume request

      case GameStatus.COMPLETED:
        return targetState === GameStatus.ENDING; // Completion sequence finished

      case GameStatus.FAILED:
        return targetState === GameStatus.ENDING; // Failure sequence finished

      case GameStatus.ENDING:
        return targetState === GameStatus.LOBBY; // Rematch requested

      default:
        return false;
    }
  }

  public transition(targetState: GameStatus, reason: string = ""): boolean {
    const currentState = this.getState();
    
    if (!this.canTransition(targetState)) {
      console.warn(`[GameState] REJECTED: ${currentState} -> ${targetState}. Reason: ${reason}`);
      return false;
    }

    console.log(`[GameState] ${currentState} -> ${targetState}. Reason: ${reason}`);

    // Call exit hooks
    this.onExit(currentState);

    // Update state
    this.room.state.gameStatus = targetState;
    this.room.state.stateVersion += 1;

    // Call enter hooks
    this.onEnter(targetState);
    
    // Broadcast state change to clients (optional if they just listen to state patches, but helpful for events)
    this.room.broadcast("game_state_changed", {
      previousState: currentState,
      currentState: targetState,
      reason
    });

    return true;
  }

  private onExit(state: GameStatus) {
    switch (state) {
      case GameStatus.LOBBY:
        // No cleanup needed
        break;
      case GameStatus.PLAYING:
        // Optionally pause timers
        break;
    }
  }

  private onEnter(state: GameStatus) {
    switch (state) {
      case GameStatus.WAITING:
        // If we dropped back to WAITING, mark all ready = false
        this.room.state.players.forEach(p => p.ready = false);
        break;
        
      case GameStatus.LOBBY:
        // Reset match-specific state
        this.room.resetMatchState();
        break;

      case GameStatus.STARTING:
        // Initialize world, puzzle, perception
        this.room.initializeWorld();
        
        // Start a short countdown, then transition to PLAYING
        setTimeout(() => {
          if (this.getState() === GameStatus.STARTING) {
            this.transition(GameStatus.PLAYING, "Countdown complete");
          }
        }, 3000);
        break;

      case GameStatus.PLAYING:
        // Record start time if not already
        if (this.room.state.startedAt === 0) {
          this.room.state.startedAt = Date.now();
        }
        
        // Start Panic Mode if mode is Panic or Team Roles (or just always since it handles itself if puzzle is short)
        // Let's start it always as part of the core loop for now
        this.room.panicManager.startPanic(180000); // 3 minutes
        break;

      case GameStatus.COMPLETED:
        // Freeze gameplay
        // Disable puzzle interactions
        this.room.panicManager.completePanic();
        
        // Wait a few seconds for victory presentation, then go to ENDING
        setTimeout(() => {
          if (this.getState() === GameStatus.COMPLETED) {
            this.transition(GameStatus.ENDING, "Victory sequence finished");
          }
        }, 5000);
        break;

      case GameStatus.FAILED:
        // Freeze gameplay
        this.room.panicManager.failPanic();
        setTimeout(() => {
          if (this.getState() === GameStatus.FAILED) {
            this.transition(GameStatus.ENDING, "Failure sequence finished");
          }
        }, 5000);
        break;

      case GameStatus.ENDING:
        // Just sit in ENDING until players request a rematch (handled by client message)
        break;
    }
  }
}

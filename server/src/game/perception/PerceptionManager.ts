import { GameRoom } from "../../rooms/GameRoom";
import { ClientReality } from "@blind-spot/shared";

export class PerceptionManager {
  private room: GameRoom;

  constructor(room: GameRoom) {
    this.room = room;
  }

  // Called when a player joins to set up their ClientReality container
  public initializePlayer(playerId: string) {
    const reality = new ClientReality();
    reality.playerId = playerId;
    this.room.state.clientRealities.set(playerId, reality);
    
    // Immediately calculate their view
    this.recalculateForPlayer(playerId);
  }

  public removePlayer(playerId: string) {
    this.room.state.clientRealities.delete(playerId);
  }

  // Recalculates the reality for all connected players. 
  // Should be called after significant world state changes.
  public recalculateAll() {
    for (const playerId of this.room.state.players.keys()) {
      this.recalculateForPlayer(playerId);
    }
  }

  // Evaluates every object against the rules for a specific player
  public recalculateForPlayer(playerId: string) {
    const reality = this.room.state.clientRealities.get(playerId);
    if (!reality) return;

    // Clear current visible interactables (we'll rebuild the list)
    // Note: We create a new MapSchema or carefully add/remove to preserve Colyseus delta.
    // For simplicity, we'll iterate and sync.
    
    // 1. Find all objects that should be visible
    const newVisibleIds = new Set<string>();
    
    for (const [objectId, interactable] of this.room.state.interactables.entries()) {
      // Evaluate perception using RuleEngine
      const ruleResult = this.room.ruleEngine.evaluate("PERCEPTION", {
        player: this.room.state.players.get(playerId),
        object: interactable,
        room: this.room,
        gameState: this.room.state
      });

      // ALLOW means visible. If it's explicitly DENY or PASS (and we decide PASS means hidden by default),
      // we'll treat ALLOW as the only way an object is visible.
      if (ruleResult.outcome === "ALLOW") {
        newVisibleIds.add(objectId);
      }
    }

    // 2. Remove objects they can no longer see
    for (const visibleId of reality.visibleInteractables.keys()) {
      if (!newVisibleIds.has(visibleId)) {
        reality.visibleInteractables.delete(visibleId);
      }
    }

    // 3. Add objects they can now see (or update existing clones)
    for (const visibleId of newVisibleIds) {
      const sourceObj = this.room.state.interactables.get(visibleId);
      if (sourceObj) {
        // Colyseus Note: we must assign a clone to the filtered map to prevent shared reference issues,
        // or just rely on the server keeping one instance. Wait! If multiple players see the SAME object,
        // we can just share the reference in memory if it doesn't contain private state.
        // For Different Reality, we'll assign the reference for now. Colyseus handles shared references fine.
        reality.visibleInteractables.set(visibleId, sourceObj);
      }
    }
    // 4. Also handle puzzles
    for (const [puzzleId, puzzle] of this.room.state.puzzles.entries()) {
      // For now, all puzzles are visible to all players. We can add PuzzlePerceptionRules later.
      reality.visiblePuzzles.set(puzzleId, puzzle);
    }
  }
}

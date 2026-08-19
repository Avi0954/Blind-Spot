import { useEffect, useState } from "react";
import { Room } from "colyseus.js";
import { PuzzleState } from "@blind-spot/shared";

export function PuzzleUI({ room }: { room: Room }) {
  const [puzzles, setPuzzles] = useState<Map<string, PuzzleState>>(new Map());

  useEffect(() => {
    // Wait for the clientReality to exist (might not be immediate on load)
    const checkReality = setInterval(() => {
      const reality = room.state.clientRealities.get(room.sessionId);
      if (reality) {
        clearInterval(checkReality);
        
        const updatePuzzles = () => setPuzzles(new Map(reality.visiblePuzzles));
        reality.visiblePuzzles.onAdd = updatePuzzles;
        reality.visiblePuzzles.onRemove = updatePuzzles;
        reality.visiblePuzzles.onChange = updatePuzzles;
        updatePuzzles();
      }
    }, 100);

    return () => clearInterval(checkReality);
  }, [room]);

  return (
    <div style={{
      position: "absolute",
      top: 20,
      right: 20,
      width: 250,
      zIndex: 10,
      color: "var(--text-primary)",
      fontFamily: "var(--font-mono)",
      pointerEvents: "none"
    }}>
      {Array.from(puzzles.values()).map(puzzle => {
        let progress = null;
        try {
          progress = JSON.parse(puzzle.progress);
        } catch (e) {
          // ignore parsing error
        }

        return (
          <div key={puzzle.id} style={{
            background: "rgba(0,0,0,0.7)",
            border: `1px solid ${puzzle.completed ? "#00ff00" : (puzzle.state === "failed" ? "#ff0000" : "#555")}`,
            padding: 10,
            marginBottom: 10,
            borderRadius: 4
          }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: 4 }}>
              {puzzle.id.toUpperCase()}
            </div>
            
            <div style={{ fontSize: "16px", fontWeight: "bold", color: puzzle.completed ? "#00ff00" : "white" }}>
              {puzzle.completed ? "COMPLETED" : (puzzle.state === "failed" ? "FAILED" : "ACTIVE")}
            </div>

            {/* Render type-specific progress */}
            {puzzle.type === "sequence" && progress && !puzzle.completed && (
              <div style={{ marginTop: 8, display: "flex", gap: "4px" }}>
                {Array.from({ length: progress.total }).map((_, i) => (
                  <div key={i} style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: i < progress.currentIndex ? "#00ff00" : "rgba(255,255,255,0.2)"
                  }} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

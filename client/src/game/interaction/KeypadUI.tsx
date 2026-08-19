import { useState, useEffect } from "react";
import { Room } from "colyseus.js";
import { useGameStore } from "../../store/gameStore";

export function KeypadUI({ room }: { room: Room }) {
  const activeInteractableId = useGameStore((state) => state.activeInteractableId);
  const [code, setCode] = useState<number[]>([]);

  // Only render if the active interactable is a keypad
  const reality = room.state.clientRealities.get(room.sessionId);
  const interactable = reality?.visibleInteractables.get(activeInteractableId || "");

  if (!interactable || interactable.type !== "keypad") return null;

  const handleKeyPress = (num: number) => {
    setCode(prev => {
      if (prev.length < 4) return [...prev, num];
      return prev;
    });
  };

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleKeyPress(parseInt(e.key));
      } else if (e.key === "Enter") {
        // Trigger submit
        handleSubmit();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleClear();
      } else if (e.key === "Escape") {
        useGameStore.getState().setActiveInteractableId(null);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [code]);

  const handleClear = () => {
    setCode([]);
  };

  const handleSubmit = () => {
    // Note: Use a ref or grab the current state of code directly if this is called from the effect.
    // Wait, the effect has [code] as a dependency, so it binds the latest state of code.
    if (code.length === 4) {
      room.send("interact_request", { objectId: interactable.id, payload: { code } });
      setCode([]);
      useGameStore.getState().setActiveInteractableId(null);
    }
  };

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 100,
      color: "white", fontFamily: "var(--font-mono)"
    }}>
      <h2>ENTER SEQUENCE</h2>
      
      <div style={{
        display: "flex", gap: "10px", margin: "20px 0",
        fontSize: "32px", letterSpacing: "10px"
      }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} style={{ borderBottom: "2px solid white", padding: "0 10px" }}>
            {code[i] !== undefined ? code[i] : "_"}
          </span>
        ))}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px",
        width: "200px"
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button key={num} onClick={() => handleKeyPress(num)} style={{
            padding: "15px", background: "#333", color: "white",
            border: "1px solid #555", cursor: "pointer", fontSize: "20px"
          }}>
            {num}
          </button>
        ))}
        <button onClick={handleClear} style={{
          padding: "15px", background: "#522", color: "white",
          border: "1px solid #744", cursor: "pointer", fontSize: "16px"
        }}>
          CLR
        </button>
        <button onClick={() => handleKeyPress(0)} style={{
          padding: "15px", background: "#333", color: "white",
          border: "1px solid #555", cursor: "pointer", fontSize: "20px"
        }}>
          0
        </button>
        <button onClick={handleSubmit} style={{
          padding: "15px", background: "#252", color: "white",
          border: "1px solid #474", cursor: "pointer", fontSize: "16px"
        }}>
          ENT
        </button>
      </div>
      
      <p style={{ marginTop: "30px", color: "#888", fontSize: "12px" }}>[ESC] to cancel</p>
    </div>
  );
}

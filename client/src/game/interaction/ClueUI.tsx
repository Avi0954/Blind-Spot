import { Room } from "colyseus.js";
import { useGameStore } from "../../store/gameStore";

export function ClueUI({ room }: { room: Room }) {
  const activeInteractableId = useGameStore((state) => state.activeInteractableId);

  const reality = room.state.clientRealities.get(room.sessionId);
  const interactable = reality?.visibleInteractables.get(activeInteractableId || "");

  if (!interactable || interactable.type !== "clue") return null;

  let metadata: { clue?: string, title?: string } = {};
  try {
    metadata = JSON.parse(interactable.metadata);
  } catch (e) {
    // ignore parse errors
  }

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 100,
      color: "white", fontFamily: "var(--font-mono)", textAlign: "center"
    }}>
      <h2 style={{ color: "#aaa", marginBottom: "40px", fontSize: "16px" }}>
        {metadata.title || "YOUR CLUE"}
      </h2>
      
      <div style={{
        fontSize: "48px", letterSpacing: "15px", marginBottom: "60px",
        textShadow: "0 0 10px rgba(255,255,255,0.5)"
      }}>
        {metadata.clue}
      </div>

      <div style={{ color: "#888", maxWidth: "400px", lineHeight: "1.5" }}>
        YOUR REALITY IS INCOMPLETE.<br /><br />
        Communicate with the other player.
      </div>
      
      <p style={{ marginTop: "40px", color: "#555", fontSize: "12px" }}>[ESC] to close</p>
    </div>
  );
}

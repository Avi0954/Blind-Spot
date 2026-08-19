import { useGameStore } from "../../store/gameStore";
import { useEffect, useState } from "react";
import { Room } from "colyseus.js";

export function InteractionPrompt({ room }: { room: Room }) {
  const activeInteractableId = useGameStore(state => state.activeInteractableId);
  const [promptText, setPromptText] = useState("");

  useEffect(() => {
    if (!activeInteractableId) {
      setPromptText("");
      return;
    }

    const interactable = room.state.interactables.get(activeInteractableId);
    if (!interactable || !interactable.enabled) {
      setPromptText("");
      return;
    }

    // Determine prompt based on type and state
    let action = "Interact";
    if (interactable.type === "door") {
      action = interactable.state === "closed" ? "Open Door" : "Close Door";
    } else if (interactable.type === "lever" || interactable.type === "switch") {
      action = interactable.state === "off" ? "Turn On" : "Turn Off";
    } else if (interactable.type === "key") {
      action = "Pick Up Key";
    }

    setPromptText(`[E] ${action}`);
  }, [activeInteractableId, room.state.interactables]);

  if (!promptText) return null;

  return (
    <div style={{
      position: "absolute",
      top: "55%", // Slightly below crosshair
      left: "50%",
      transform: "translate(-50%, 0)",
      color: "white",
      fontFamily: "var(--font-mono)",
      fontSize: "14px",
      textShadow: "1px 1px 2px black",
      pointerEvents: "none",
      zIndex: 10,
      background: "rgba(0,0,0,0.5)",
      padding: "4px 8px",
      borderRadius: "4px",
      border: "1px solid rgba(255,255,255,0.2)"
    }}>
      {promptText}
    </div>
  );
}

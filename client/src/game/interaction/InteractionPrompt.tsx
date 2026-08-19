import { useEffect, useState } from "react";
import { Room } from "colyseus.js";
import { useGameStore } from "../../store/gameStore";
import { ROLE_DEFINITIONS, RoleType } from "@blind-spot/shared";

export function InteractionPrompt({ room }: { room: Room }) {
  const activeInteractableId = useGameStore((state) => state.activeInteractableId);
  const [prompt, setPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!activeInteractableId) {
      setPrompt(null);
      return;
    }

    const clientReality = room.state.clientRealities.get(room.sessionId);
    const interactable = clientReality?.visibleInteractables.get(activeInteractableId);
    
    if (!interactable) {
      setPrompt(null);
      return;
    }

    // Determine prompt based on type and state
    let text = "[E] Interact";
    if (interactable.type === "door") {
      text = interactable.state === "closed" ? "[E] Open Door" : interactable.state === "open" ? "[E] Close Door" : "";
    } else if (interactable.type === "key") {
      text = "[E] Pick Up Key";
    } else if (interactable.type === "lever") {
      text = interactable.state === "off" ? "[E] Turn On" : "[E] Turn Off";
    } else if (interactable.type === "keypad") {
      text = "[E] Enter Code";
    } else if (interactable.type === "clue") {
      text = "[E] Inspect Panel";
    }

    // Check Ability
    const player = room.state.players.get(room.sessionId);
    const roleDef = player ? ROLE_DEFINITIONS[player.role as RoleType] : null;
    
    let isAuthorized = true;
    if (interactable.requiredAbility && roleDef) {
      if (!roleDef.abilities.includes(interactable.requiredAbility as any)) {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      setPrompt(`[Requires ${interactable.requiredAbility.replace(/_/g, " ")}]`);
      return;
    }

    setPrompt(text);

  }, [activeInteractableId, room.state.clientRealities, room.sessionId]); 

  // For Colyseus changes during active hover:
  useEffect(() => {
    if (!activeInteractableId) return;

    const reality = room.state.clientRealities.get(room.sessionId);
    if (!reality) return;

    const onChange = () => {
      // trigger re-render of above effect by forcing state update if needed
      // Actually, updating a counter state is a trick to force re-evaluation
      setTick(t => t + 1);
    };

    reality.visibleInteractables.onChange = onChange;
    return () => { reality.visibleInteractables.onChange = undefined; };
  }, [activeInteractableId, room.state.clientRealities, room.sessionId]);

  const [_, setTick] = useState(0);

  if (!prompt) return null;

  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, 20px)",
      color: prompt.startsWith("[Requires") ? "#ff4444" : "white",
      background: prompt.startsWith("[Requires") ? "rgba(50,0,0,0.8)" : "rgba(0,0,0,0.5)",
      padding: "4px 8px",
      borderRadius: "4px",
      fontFamily: "var(--font-mono)",
      fontSize: "14px",
      pointerEvents: "none",
      zIndex: 10
    }}>
      {prompt}
    </div>
  );
}

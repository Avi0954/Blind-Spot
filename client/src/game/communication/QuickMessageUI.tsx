import { useEffect, useState } from "react";
import { Room } from "colyseus.js";

const QUICK_MESSAGES = [
  { key: "1", text: "LOOK HERE", type: "LOOK_HERE" },
  { key: "2", text: "I FOUND SOMETHING", type: "I_FOUND_SOMETHING" },
  { key: "3", text: "COME HERE", type: "COME_HERE" },
  { key: "4", text: "DANGER", type: "DANGER" },
  { key: "5", text: "I NEED HELP", type: "normal" },
  { key: "6", text: "YES", type: "normal" },
  { key: "7", text: "NO", type: "normal" }
];

export function QuickMessageUI({ room }: { room: Room<any> }) {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "q" || e.key === "Q") {
        setShowMenu(true);
      }

      if (showMenu) {
        const msg = QUICK_MESSAGES.find(m => m.key === e.key);
        if (msg) {
          if (msg.type !== "normal") {
            // Also send a ping if it's a ping-like message
            // Wait, PingManager handles raycasting, so we can't easily raycast from here without useThree.
            // But we can send it as a quick chat message.
            room.send("chat_send", { text: msg.text, type: "quick" });
          } else {
            room.send("chat_send", { text: msg.text, type: "quick" });
          }
          setShowMenu(false);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q") {
        setShowMenu(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [showMenu, room]);

  if (!showMenu) return null;

  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      zIndex: 60,
      background: "rgba(0,0,0,0.8)",
      padding: "20px",
      borderRadius: "4px",
      border: "1px solid var(--border-color)",
      boxShadow: "0 0 20px black",
      fontFamily: "var(--font-mono)",
      color: "var(--text-primary)"
    }}>
      <h3 style={{ margin: "0 0 15px 0", fontSize: "1rem", color: "var(--text-secondary)", textAlign: "center" }}>QUICK COMM</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
        {QUICK_MESSAGES.map(msg => (
          <li key={msg.key} style={{ display: "flex", justifyContent: "space-between", gap: "20px", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--accent)" }}>[{msg.key}]</span>
            <span>{msg.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

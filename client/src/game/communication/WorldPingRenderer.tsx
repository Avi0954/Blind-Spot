import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { WorldPing } from "@blind-spot/shared";
import { Room } from "colyseus.js";
import { AudioFeedback } from "./AudioFeedback";

export function WorldPingRenderer({ room }: { room: Room<any> }) {
  const [pings, setPings] = useState<WorldPing[]>([]);

  useEffect(() => {
    // Initial sync
    setPings(Array.from(room.state.pings.values()));

    const updatePings = () => {
      setPings(Array.from(room.state.pings.values()));
    };

    const onAdd = (ping: WorldPing) => {
      if (ping.senderId !== room.sessionId) {
        AudioFeedback.playPingSound();
      }
      updatePings();
    };

    room.state.pings.onAdd = onAdd;
    room.state.pings.onRemove = updatePings;
    room.state.pings.onChange = updatePings;

    return () => {
      // Cleanup listeners if necessary (handled by room.state automatically for these callbacks)
    };
  }, [room]);

  return (
    <>
      {pings.map((ping) => {
        // Parse position safely
        const x = ping.position?.x ?? 0;
        const y = ping.position?.y ?? 0;
        const z = ping.position?.z ?? 0;

        return (
          <Html 
            key={ping.id} 
            position={[x, y, z]} 
            center
            style={{ pointerEvents: "none" }}
          >
            <div 
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: "translate3d(0, -50%, 0)",
              }}
            >
              <div 
                style={{
                  background: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid var(--accent)",
                  color: "var(--text-primary)",
                  padding: "4px 8px",
                  borderRadius: "2px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  textShadow: "1px 1px 2px black",
                  boxShadow: "0 0 10px var(--accent)",
                }}
              >
                <div style={{ color: "var(--text-secondary)", fontSize: "0.6rem", marginBottom: "2px" }}>
                  [{ping.senderName}]
                </div>
                <div>{ping.type.replace(/_/g, " ")}</div>
              </div>
              <div 
                style={{
                  width: "2px",
                  height: "20px",
                  background: "var(--accent)",
                  opacity: 0.8,
                  boxShadow: "0 0 5px var(--accent)",
                }}
              />
              <div 
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  boxShadow: "0 0 10px var(--accent)",
                }}
              />
            </div>
          </Html>
        );
      })}
    </>
  );
}

import React, { useEffect, useState } from "react";
import { PanicState, PanicPhase } from "@blind-spot/shared";

interface PanicTimerUIProps {
  panic: PanicState;
}

export const PanicTimerUI: React.FC<PanicTimerUIProps> = ({ panic }) => {
  const [remaining, setRemaining] = useState<number>(0);

  // Sync with server authoritative time
  useEffect(() => {
    if (!panic.active || panic.completed || panic.failed) {
      if (panic.failed) setRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, panic.endsAt - now);
      setRemaining(left);
    }, 100);

    return () => clearInterval(interval);
  }, [panic.active, panic.endsAt, panic.completed, panic.failed]);

  if (!panic.active && !panic.failed) return null;

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const ms = Math.floor((remaining % 1000) / 10);
  
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;

  let color = "#00ffff"; // NORMAL
  let title = "SYSTEM STABLE";

  switch (panic.phase) {
    case PanicPhase.WARNING:
      color = "#ffaa00";
      title = "WARNING";
      break;
    case PanicPhase.UNSTABLE:
      color = "#ff5500";
      title = "SYSTEM UNSTABLE";
      break;
    case PanicPhase.EMERGENCY:
      color = "#ff0000";
      title = "EMERGENCY PROCEDURES";
      break;
    case PanicPhase.FAILURE:
      color = "#550000";
      title = "SYSTEM FAILURE";
      break;
  }

  return (
    <div style={{
      position: "absolute",
      top: 20,
      right: 20,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      fontFamily: "var(--font-mono)",
      pointerEvents: "none",
      zIndex: 50,
      color
    }}>
      <div style={{ fontSize: "16px", letterSpacing: "4px", marginBottom: "4px" }}>
        {title}
      </div>
      <div style={{ fontSize: "32px", fontWeight: "bold", letterSpacing: "2px", textShadow: `0 0 10px ${color}88` }}>
        {panic.failed ? "00:00.00" : timeString}
      </div>
    </div>
  );
};

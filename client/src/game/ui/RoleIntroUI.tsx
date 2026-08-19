import React from "react";
import { RoleType, ROLE_DEFINITIONS } from "@blind-spot/shared";

interface RoleIntroUIProps {
  role: RoleType;
}

export const RoleIntroUI: React.FC<RoleIntroUIProps> = ({ role }) => {
  const roleDef = ROLE_DEFINITIONS[role];

  if (!roleDef) return null;

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 60,
      color: "white", fontFamily: "var(--font-mono)", textAlign: "center"
    }}>
      <h3 style={{ fontSize: "24px", color: "#888", letterSpacing: "5px", marginBottom: "10px" }}>YOUR ROLE</h3>
      <h1 style={{ fontSize: "64px", letterSpacing: "10px", margin: "0 0 40px 0", color: "#00ffff", textShadow: "0 0 20px rgba(0,255,255,0.5)" }}>
        {roleDef.name}
      </h1>
      <p style={{ fontSize: "24px", maxWidth: "600px", lineHeight: "1.5", color: "#ddd" }}>
        {roleDef.description}
      </p>
      
      <div style={{ marginTop: "40px", borderTop: "1px solid #444", paddingTop: "20px", display: "inline-block", textAlign: "left" }}>
        <h4 style={{ color: "#aaa", marginBottom: "10px" }}>AUTHORIZED ABILITIES:</h4>
        <ul style={{ listStyleType: "none", padding: 0, margin: 0, color: "#fff" }}>
          {roleDef.abilities.map(ability => (
            <li key={ability} style={{ marginBottom: "8px" }}>✓ {ability.replace(/_/g, " ")}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

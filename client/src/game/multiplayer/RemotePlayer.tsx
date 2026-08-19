import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { Player } from "@blind-spot/shared";

export function RemotePlayer({ player, isTyping, quickMessage }: { player: Player, isTyping?: boolean, quickMessage?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  // We use useFrame to smoothly interpolate (lerp) from current position to target position
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    // Server positions
    const targetPos = new THREE.Vector3(player.position.x, player.position.y, player.position.z);
    
    // Smoothly lerp towards target (10 is an arbitrary smoothing factor)
    groupRef.current.position.lerp(targetPos, THREE.MathUtils.clamp(delta * 15, 0, 1));
    
    // Smoothly slerp rotation (yaw only)
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, player.rotation.y, 0, 'YXZ'));
    groupRef.current.quaternion.slerp(targetQuat, THREE.MathUtils.clamp(delta * 15, 0, 1));
  });

  return (
    <group ref={groupRef} position={[player.position.x, player.position.y, player.position.z]}>
      {/* Name tag */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
      >
        {player.name}
      </Text>
      
      {/* Typing & Quick Message Indicator */}
      <Html position={[0, 1.6, 0]} center style={{ pointerEvents: "none", zIndex: 10 }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "var(--font-mono)",
          whiteSpace: "nowrap",
          textShadow: "1px 1px 2px black"
        }}>
          {isTyping && <div style={{ color: "var(--accent)", fontSize: "0.75rem", background: "rgba(0,0,0,0.5)", padding: "2px 4px", borderRadius: "2px" }}>[typing...]</div>}
          {quickMessage && <div style={{ color: "white", fontSize: "0.85rem", background: "rgba(0,0,0,0.7)", border: "1px solid var(--accent)", padding: "4px 8px", borderRadius: "2px", marginTop: "4px" }}>{quickMessage}</div>}
        </div>
      </Html>

      {/* Player Avatar (Capsule to match physics shape) */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        {/* Our physics capsule is 1m tall + 0.3 radius caps = 1.6m total.
            R3F capsuleGeometry uses (radius, length). So 0.3 radius, 1.0 length. */}
        <capsuleGeometry args={[0.3, 1.0, 16, 16]} />
        <meshStandardMaterial color={player.ready ? "#44aa44" : "#aa4444"} roughness={0.6} />
      </mesh>
      
      {/* Visor/Eye to indicate facing direction */}
      <mesh position={[0, 0.3, 0.25]}>
        <boxGeometry args={[0.4, 0.15, 0.1]} />
        <meshStandardMaterial color="#222" emissive="#111" />
      </mesh>
    </group>
  );
}

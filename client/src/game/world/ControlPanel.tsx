import { RigidBody } from "@react-three/rapier";
import { Room } from "colyseus.js";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function ControlPanel({ position, rotation, interactableId, room }: { position: [number, number, number], rotation: [number, number, number], interactableId: string, room: Room }) {
  const handleRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!handleRef.current) return;
    const cr = room.state.clientRealities.get(room.sessionId);
    const interactable = cr?.visibleInteractables.get(interactableId);
    if (!interactable) return;

    // Lever is 'off' (up) or 'on' (down)
    const targetX = interactable.state === "on" ? Math.PI / 4 : -Math.PI / 4;
    handleRef.current.rotation.x = THREE.MathUtils.lerp(handleRef.current.rotation.x, targetX, delta * 10);
  });

  const clientReality = room.state.clientRealities.get(room.sessionId);
  const interactable = clientReality?.visibleInteractables.get(interactableId);
  
  if (!interactable) return null;

  const statusColor = interactable.state === "on" ? "#00ff00" : "#ff0000";

  return (
    <RigidBody type="fixed" colliders="hull" userData={{ interactableId }}>
      <group position={position} rotation={rotation}>
        {/* Panel Base */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.8, 0.1]} />
          <meshStandardMaterial color="#333" roughness={0.7} metalness={0.5} />
        </mesh>

        {/* Screen */}
        <mesh position={[-0.2, 0.1, 0.06]}>
          <boxGeometry args={[0.6, 0.4, 0.02]} />
          <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.2} roughness={0.1} />
        </mesh>

        {/* Animated Lever Handle */}
        <group position={[0.375, -0.15, 0.08]} ref={handleRef}>
          <mesh position={[0, 0, 0.15]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#888" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.3]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#aa0000" roughness={0.3} />
          </mesh>
        </group>
        
        {/* Indicator Light */}
        <mesh position={[-0.4, -0.2, 0.06]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={1} />
        </mesh>
        <pointLight position={[-0.4, -0.2, 0.1]} intensity={0.2} color={statusColor} distance={1} />
      </group>
    </RigidBody>
  );
}

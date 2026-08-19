import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { Room } from "colyseus.js";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export function Door({ position, rotation, interactableId, room }: { position: [number, number, number], rotation: [number, number, number], interactableId: string, room: Room }) {
  const doorWidth = 1.6;
  const doorHeight = 2.4;
  const hingeRef = useRef<THREE.Group>(null);

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: "#2a2a2a",
    roughness: 0.4,
    metalness: 0.7,
  });

  useFrame((_, delta) => {
    if (!hingeRef.current) return;
    const cr = room.state.clientRealities.get(room.sessionId);
    const interactable = cr?.visibleInteractables.get(interactableId);
    if (!interactable) return;

    // Determine target rotation based on state
    const targetY = (interactable.state === "open" || interactable.state === "opening") ? -Math.PI / 2 : 0;
    
    // Smoothly animate the door hinge
    hingeRef.current.rotation.y = THREE.MathUtils.lerp(hingeRef.current.rotation.y, targetY, delta * 5);
  });

  const clientReality = room.state.clientRealities.get(room.sessionId);
  const interactable = clientReality?.visibleInteractables.get(interactableId);
  
  if (!interactable) return null;

  const statusColor = interactable.state === "open" ? "#00cc00" : interactable.state === "opening" ? "#cccc00" : "#cc0000";

  return (
    <group position={position} rotation={rotation}>
      {/* Door Frame */}
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, doorHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[doorWidth + 0.2, doorHeight + 0.1, 0.6]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Door Panel attached to a Hinge */}
      <group position={[-doorWidth / 2, 0, 0]} ref={hingeRef}>
        <RigidBody type="fixed" colliders="hull" userData={{ interactableId }}>
          {/* Offset mesh so hinge is at the edge */}
          <group position={[doorWidth / 2, 0, 0]}>
            <mesh position={[0, doorHeight / 2, 0.1]} castShadow receiveShadow>
              <boxGeometry args={[doorWidth, doorHeight, 0.2]} />
              <primitive object={metalMaterial} attach="material" />
            </mesh>
            {/* Door Handle */}
            <mesh position={[0.6, 1.0, 0.25]} castShadow>
              <boxGeometry args={[0.05, 0.4, 0.1]} />
              <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* Status Light */}
      <mesh position={[0, doorHeight + 0.3, 0.35]}>
        <boxGeometry args={[0.4, 0.15, 0.1]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.5} />
      </mesh>
      
      <pointLight position={[0, doorHeight + 0.4, 0.5]} intensity={0.5} color={statusColor} distance={3} decay={2} />
    </group>
  );
}

import { RigidBody } from "@react-three/rapier";
import { Room } from "colyseus.js";

export function InteractableObject({ position, color = "#ffaa00", interactableId, room }: { position: [number, number, number], color?: string, interactableId: string, room: Room }) {
  
  const interactable = room.state.interactables.get(interactableId);
  
  // If consumed (e.g. key picked up), don't render it at all
  if (interactable && interactable.state === "consumed") {
    return null;
  }

  return (
    <RigidBody type="fixed" colliders="cuboid" userData={{ interactableId }}>
      <group position={position}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.1, 0.1]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
        </mesh>
        <pointLight intensity={0.5} color={color} distance={0.5} decay={2} />
      </group>
    </RigidBody>
  );
}

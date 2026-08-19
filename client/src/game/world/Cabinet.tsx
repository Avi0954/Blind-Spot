import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";

export function Cabinet({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: "#4a5350", // Industrial greenish gray
    roughness: 0.6,
    metalness: 0.3,
  });

  const handleMaterial = new THREE.MeshStandardMaterial({
    color: "#777",
    roughness: 0.2,
    metalness: 0.9,
  });

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <group position={position} rotation={rotation}>
      {/* Main Body */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.6, 0.6]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>

      {/* Drawer 1 */}
      <mesh position={[0, 1.3, 0.32]} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.05]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 1.3, 0.36]} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <primitive object={handleMaterial} attach="material" />
      </mesh>

      {/* Drawer 2 */}
      <mesh position={[0, 0.8, 0.32]} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.05]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.8, 0.36]} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <primitive object={handleMaterial} attach="material" />
      </mesh>

      {/* Drawer 3 */}
      <mesh position={[0, 0.3, 0.32]} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.05]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.3, 0.36]} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <primitive object={handleMaterial} attach="material" />
      </mesh>
      </group>
    </RigidBody>
  );
}

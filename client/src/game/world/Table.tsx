import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";

export function Table({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: "#3d2817",
    roughness: 0.9,
  });

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: "#222",
    roughness: 0.6,
    metalness: 0.8,
  });

  return (
    <RigidBody type="fixed" colliders="hull">
      <group position={position} rotation={rotation}>
      {/* Table Top */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.1, 1.0]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.9, 0.5, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>
      <mesh position={[0.9, 0.5, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.9, 0.5, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>
      <mesh position={[0.9, 0.5, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <primitive object={metalMaterial} attach="material" />
      </mesh>
      </group>
    </RigidBody>
  );
}

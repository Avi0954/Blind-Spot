import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";

export function Room() {
  const roomSize = 10;
  const wallHeight = 4;

  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: "#444444",
    roughness: 0.9,
    metalness: 0.1,
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: "#222222",
    roughness: 1.0,
  });

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomSize, roomSize]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, wallHeight, 0]} receiveShadow>
        <planeGeometry args={[roomSize, roomSize]} />
        <primitive object={ceilingMaterial} attach="material" />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, wallHeight / 2, -roomSize / 2]} receiveShadow castShadow>
        <boxGeometry args={[roomSize, wallHeight, 0.5]} />
        <primitive object={concreteMaterial} attach="material" />
      </mesh>

      {/* Front Wall */}
      <mesh position={[0, wallHeight / 2, roomSize / 2]} receiveShadow castShadow>
        <boxGeometry args={[roomSize, wallHeight, 0.5]} />
        <primitive object={concreteMaterial} attach="material" />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-roomSize / 2, wallHeight / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, wallHeight, roomSize]} />
        <primitive object={concreteMaterial} attach="material" />
      </mesh>

      {/* Right Wall */}
      <mesh position={[roomSize / 2, wallHeight / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, wallHeight, roomSize]} />
        <primitive object={concreteMaterial} attach="material" />
      </mesh>
      
      {/* Primary Practical Light (Overhead Fluorescent style) */}
      <pointLight position={[0, 3.5, 0]} intensity={1.5} color="#fff1e0" castShadow distance={15} decay={2} />
      
      {/* Ambient shadow-fill */}
      <ambientLight intensity={0.15} />
      </group>
    </RigidBody>
  );
}

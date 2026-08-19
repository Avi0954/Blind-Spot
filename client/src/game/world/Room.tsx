import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useState } from "react";
import { PanicPhase } from "@blind-spot/shared";

export function Room({ room }: { room: any }) {
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
      
      <PanicEnvironment room={room} />
      </group>
    </RigidBody>
  );
}

function PanicEnvironment({ room }: { room: any }) {
  const [phase, setPhase] = useState(room?.state?.panic?.phase || PanicPhase.IDLE);
  const [flicker, setFlicker] = useState(1);

  useEffect(() => {
    if (!room) return;
    const unsub = room.state.panic.listen("phase", (currentValue: string) => {
      setPhase(currentValue);
    });
    return () => unsub();
  }, [room]);

  useEffect(() => {
    if (phase === PanicPhase.WARNING) {
      const interval = setInterval(() => {
        setFlicker(Math.random() > 0.8 ? 0.5 : 1);
      }, 200);
      return () => clearInterval(interval);
    } else if (phase === PanicPhase.UNSTABLE) {
      const interval = setInterval(() => {
        setFlicker(Math.random() > 0.6 ? 0.3 : 1);
      }, 100);
      return () => clearInterval(interval);
    } else if (phase === PanicPhase.EMERGENCY || phase === PanicPhase.FAILURE) {
      const interval = setInterval(() => {
        // Red flashing effect
        setFlicker(Math.sin(Date.now() / 200) * 0.5 + 0.5);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setFlicker(1);
    }
  }, [phase]);

  const getLightProps = () => {
    if (phase === PanicPhase.EMERGENCY || phase === PanicPhase.FAILURE) {
      return { color: "#ff0000", intensity: 1.0 * flicker, ambient: 0.05 };
    } else if (phase === PanicPhase.UNSTABLE) {
      return { color: "#ff8800", intensity: 1.2 * flicker, ambient: 0.1 };
    } else if (phase === PanicPhase.WARNING) {
      return { color: "#fff1e0", intensity: 1.3 * flicker, ambient: 0.12 };
    }
    return { color: "#fff1e0", intensity: 1.5, ambient: 0.15 };
  };

  const props = getLightProps();

  return (
    <>
      <pointLight position={[0, 3.5, 0]} intensity={props.intensity} color={props.color} castShadow distance={15} decay={2} />
      <ambientLight intensity={props.ambient} />
    </>
  );
}

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { Room } from "colyseus.js";
import { useGameStore } from "../../store/gameStore";

export function PlayerCamera({ room }: { room: Room }) {
  const { camera } = useThree();
  const { rapier, world } = useRapier();
  const bodyRef = useRef<RapierRigidBody>(null);
  
  const moveState = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const lastSendTime = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": moveState.current.forward = true; break;
        case "KeyA": moveState.current.left = true; break;
        case "KeyS": moveState.current.backward = true; break;
        case "KeyD": moveState.current.right = true; break;
        case "ShiftLeft": moveState.current.sprint = true; break;
        case "KeyE": interact(); break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": moveState.current.forward = false; break;
        case "KeyA": moveState.current.left = false; break;
        case "KeyS": moveState.current.backward = false; break;
        case "KeyD": moveState.current.right = false; break;
        case "ShiftLeft": moveState.current.sprint = false; break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [camera, world, rapier]);

  const interact = () => {
    const targetId = useGameStore.getState().activeInteractableId;
    if (targetId) {
      room.send("interact_request", { objectId: targetId });
    }
  };

  useFrame(() => {
    if (!bodyRef.current) return;
    
    // Continuous Raycast for UI Prompt
    const origin = camera.position;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const ray = new rapier.Ray(origin, dir);
    const hit = world.castRay(ray, 3.0, true);
    
    let hitId = null;
    if (hit && hit.collider) {
      const parent = hit.collider.parent();
      const userData = parent?.userData as { interactableId?: string } | undefined;
      if (userData?.interactableId) {
        hitId = userData.interactableId;
      }
    }
    
    if (useGameStore.getState().activeInteractableId !== hitId) {
      useGameStore.getState().setActiveInteractableId(hitId);
    }
    
    // Keep camera at the "head" of the physics body (Capsule is 1m tall + 0.3m radius ends)
    const pos = bodyRef.current.translation();
    camera.position.set(pos.x, pos.y + 0.6, pos.z); 

    // Determine movement direction relative to camera yaw
    const speed = moveState.current.sprint ? 5.0 : 2.5;
    
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, (moveState.current.backward ? 1 : 0) - (moveState.current.forward ? 1 : 0));
    const sideVector = new THREE.Vector3((moveState.current.left ? 1 : 0) - (moveState.current.right ? 1 : 0), 0, 0);

    // Apply camera rotation (ignoring pitch so we don't fly up/down)
    const yaw = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(speed).applyEuler(yaw);

    // Apply velocity, letting Rapier handle Y for gravity
    const currentVel = bodyRef.current.linvel();
    // Smooth acceleration using lerp
    const targetX = THREE.MathUtils.lerp(currentVel.x, direction.x, 0.2);
    const targetZ = THREE.MathUtils.lerp(currentVel.z, direction.z, 0.2);

    bodyRef.current.setLinvel({ x: targetX, y: currentVel.y, z: targetZ }, true);

    // Broadcast position to server at ~20Hz (every 50ms)
    const now = performance.now();
    if (now - lastSendTime.current > 50) {
      room.send("player_move", {
        position: { x: pos.x, y: pos.y, z: pos.z },
        rotation: { x: 0, y: camera.rotation.y, z: 0 }
      });
      lastSendTime.current = now;
    }
  });

  return (
    <>
      <PointerLockControls pointerSpeed={0.5} />
      {/* Dynamic rigid body locks rotation to prevent falling over, lets gravity work */}
      <RigidBody ref={bodyRef} position={[0, 1.5, 3]} colliders={false} mass={1} type="dynamic" lockRotations>
        <CapsuleCollider args={[0.5, 0.3]} />
      </RigidBody>
    </>
  );
}

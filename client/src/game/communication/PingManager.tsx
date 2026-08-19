import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Room } from "colyseus.js";

export function PingManager({ room }: { room: Room<any> }) {
  const { camera, scene } = useThree();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't ping if typing in chat
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "f" || e.key === "F") {
        createPing();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button
      if (e.button === 1 && document.activeElement?.tagName !== "INPUT") {
        createPing();
      }
    };

    const createPing = () => {
      // Raycast from center of camera
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      let hitPosition = new THREE.Vector3();

      // Find first hit that is not a trigger volume or non-visible
      const hit = intersects.find(i => i.object.visible && i.object.name !== "trigger_volume" && i.object.type === "Mesh");

      if (hit) {
        hitPosition.copy(hit.point);
      } else {
        // If nothing hit, just place it 10 units forward
        raycaster.ray.at(10, hitPosition);
      }

      room.send("ping_create", {
        type: "LOOK_HERE", // Default type for quick ping
        position: { x: hitPosition.x, y: hitPosition.y, z: hitPosition.z }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [camera, scene, room]);

  return null;
}

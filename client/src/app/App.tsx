import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { joinGameRoom } from "../multiplayer/colyseus";
import { useGameStore } from "../store/gameStore";

export function App() {
  const [error, setError] = useState<string | null>(null);
  const { status, setRoom, setStatus } = useGameStore();

  useEffect(() => {
    setStatus("connecting");
    joinGameRoom()
      .then((room) => {
        setRoom(room);
        setStatus("connected");
        
        room.onStateChange((_state) => {
          // Listen to state changes
        });
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, [setRoom, setStatus]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111", color: "white" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
        <h1>BLIND SPOT</h1>
        <p>Status: {status}</p>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
      </div>
      
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="#444" />
        </mesh>
      </Canvas>
    </div>
  );
}

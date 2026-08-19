
import { Canvas } from "@react-three/fiber";
import { Room } from "./world/Room";
import { Door } from "./world/Door";
import { Table } from "./world/Table";
import { Cabinet } from "./world/Cabinet";
import { ControlPanel } from "./world/ControlPanel";
import { InteractableObject } from "./world/InteractableObject";
import { PlayerCamera } from "./camera/PlayerCamera";
import { Physics } from "@react-three/rapier";
import { RemotePlayers } from "./multiplayer/RemotePlayers";
import { InteractionPrompt } from "./interaction/InteractionPrompt";
import { PuzzleUI } from "./puzzle/PuzzleUI";

export function ActiveGameView({ room }: { room: any }) {
  // We can listen to state changes if needed for puzzle logic later
  // For now, it's just rendering the physical room
  
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      {/* Basic HUD */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", pointerEvents: "none" }}>
        <p>MODE: {room.state.gameMode}</p>
        <p style={{ marginTop: 10 }}>[W][A][S][D] Move</p>
        <p>[SHIFT] Sprint</p>
        <p>[E] Interact</p>
        <p>[MOUSE] Look</p>
        <p>[ESC] Unlock Cursor</p>
      </div>

      <div style={{ 
        position: "absolute", top: "50%", left: "50%", 
        width: "4px", height: "4px", background: "rgba(255,255,255,0.5)", 
        borderRadius: "50%", transform: "translate(-50%, -50%)", 
        pointerEvents: "none", zIndex: 10 
      }} />

      <InteractionPrompt room={room} />
      <PuzzleUI room={room} />

      <Canvas shadows>
        <Physics>
          {/* Core Environment */}
          <Room />
          
          {/* Placed Objects */}
          <Door position={[0, 0, -5]} rotation={[0, 0, 0]} interactableId="door_01" room={room} />
          <Table position={[2, 0, 0]} rotation={[0, 0, 0]} />
          <Cabinet position={[-4.7, 0, -2]} rotation={[0, Math.PI / 2, 0]} />
          <ControlPanel position={[-4.9, 1.5, 2]} rotation={[0, Math.PI / 2, 0]} interactableId="lever_01" room={room} />
          
          {/* Interactive items */}
          <InteractableObject position={[2, 1.1, 0]} color="#cc5500" interactableId="key_01" room={room} /> {/* On the table */}

          {/* Multiplayer Avatars */}
          <RemotePlayers room={room} />

          {/* Player Controls */}
          <PlayerCamera room={room} />
        </Physics>
      </Canvas>
    </div>
  );
}

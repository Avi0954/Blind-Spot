import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Room } from "./world/Room";
import { Door } from "./world/Door";
import { Table } from "./world/Table";
import { InteractableObject } from "./world/InteractableObject";
import { PlayerCamera } from "./camera/PlayerCamera";
import { Physics } from "@react-three/rapier";
import { RemotePlayers } from "./multiplayer/RemotePlayers";
import { InteractionPrompt } from "./interaction/InteractionPrompt";
import { KeypadUI } from "./interaction/KeypadUI";
import { ClueUI } from "./interaction/ClueUI";
import { RoleIntroUI } from "./ui/RoleIntroUI";
import { RoleType } from "@blind-spot/shared";
import { useGameStore } from "../store/gameStore";

export function ActiveGameView({ room }: { room: any }) {
  const [gameStatus, setGameStatus] = useState(room.state.gameStatus);
  const [playerCount, setPlayerCount] = useState(room.state.players.size);
  const localPlayer = useGameStore((state: any) => state.players[room?.sessionId || ""]);
  const role = localPlayer?.role as RoleType || RoleType.UNASSIGNED;

  useEffect(() => {
    room.state.listen("gameStatus", (currentValue: string) => {
      setGameStatus(currentValue);
    });
    room.state.players.onAdd = () => setPlayerCount(room.state.players.size);
    room.state.players.onRemove = () => setPlayerCount(room.state.players.size);
  }, [room]);
  
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      {/* Role HUD */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", pointerEvents: "none" }}>
        <p>ROLE: {role}</p>
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

      {/* Overlays */}
      {gameStatus === "WAITING" && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 50,
          color: "white", fontFamily: "var(--font-mono)"
        }}>
          <h2>WAITING FOR ANOTHER PLAYER...</h2>
          <p style={{ marginTop: 20, fontSize: "24px", color: "#888" }}>{playerCount} / 2 PLAYERS</p>
        </div>
      )}

      {gameStatus === "LOBBY" && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 50,
          color: "white", fontFamily: "var(--font-mono)"
        }}>
          <h2>LOBBY READY</h2>
          <p style={{ marginTop: 20, fontSize: "24px", color: "#888", marginBottom: "40px" }}>{playerCount} / 2 PLAYERS</p>
          <button 
            onClick={() => room.send("start_game")}
            style={{ padding: "15px 30px", fontSize: "20px", background: "white", color: "black", cursor: "pointer", border: "none" }}
          >
            START GAME
          </button>
        </div>
      )}

      {gameStatus === "STARTING" && (
        <RoleIntroUI role={role} />
      )}

      {gameStatus === "COMPLETED" && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,50,0,0.8)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 50,
          color: "white", fontFamily: "var(--font-mono)", textAlign: "center"
        }}>
          <h2 style={{ fontSize: "48px", letterSpacing: "10px", color: "#00ff00", textShadow: "0 0 20px #00ff00" }}>REALITY ALIGNED</h2>
          <p style={{ marginTop: 20, fontSize: "24px" }}>PUZZLE SOLVED</p>
          <p style={{ marginTop: 10, fontSize: "16px", color: "#aaa" }}>YOU ESCAPED</p>
        </div>
      )}

      {gameStatus === "ENDING" && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 50,
          color: "white", fontFamily: "var(--font-mono)", textAlign: "center"
        }}>
          <h2 style={{ fontSize: "32px", letterSpacing: "10px", color: "#aaa" }}>SIMULATION ENDED</h2>
          <button 
            onClick={() => room.send("rematch")}
            style={{ marginTop: 40, padding: "15px 30px", fontSize: "20px", background: "white", color: "black", cursor: "pointer", border: "none" }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Interaction Prompts & UIs */}
      <InteractionPrompt room={room} />
      <KeypadUI room={room} />
      <ClueUI room={room} />

      {/* The 3D World */}
      <Canvas shadows>
        <Physics>
          {/* Core Environment */}
          <Room />
          
          {/* Main Exit Door */}
          <Door position={[0, 0, -5]} rotation={[0, 0, 0]} interactableId="door_01" room={room} />
          
          <Table position={[2, 0, 0]} rotation={[0, 0, 0]} />
          
          {/* MVP Puzzle Elements */}
          {/* Keypad */}
          <InteractableObject position={[-1, 1.5, -4.9]} color="#00ffcc" interactableId="keypad_01" room={room} /> 
          {/* Symbol Clue */}
          <InteractableObject position={[-4.9, 1.5, 0]} color="#cc00ff" interactableId="symbol_clue_01" room={room} />
          {/* Number Clue */}
          <InteractableObject position={[4.9, 1.5, 0]} color="#00ff00" interactableId="number_clue_01" room={room} />

          {/* Multiplayer Avatars */}
          <RemotePlayers room={room} />

          {/* Player Controls */}
          {(gameStatus === "PLAYING" || gameStatus === "COMPLETED") && <PlayerCamera room={room} />}
        </Physics>
      </Canvas>
    </div>
  );
}

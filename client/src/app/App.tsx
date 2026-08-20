import { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { joinLobbyRoom, createGameRoom, joinGameRoom } from "../multiplayer/colyseus";
import { useGameStore } from "../store/gameStore";
import { Player, GameStatus } from "@blind-spot/shared";
import * as THREE from "three";
import { ActiveGameView } from "../game/ActiveGameView";

// --------------------------------------------------------
// Subtle 3D Background Component
// --------------------------------------------------------
function LandingScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <>
      <color attach="background" args={["#0a0a0a"]} />
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 10, -5]} intensity={1.5} color="#ffffff" castShadow />
      <pointLight position={[-5, -2, 5]} intensity={2} color="#cc5500" distance={15} />

      <group ref={groupRef}>
        <mesh position={[0, 0, -5]} castShadow receiveShadow>
          <boxGeometry args={[4, 8, 4]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
        </mesh>
        <mesh position={[4, 2, -2]} castShadow>
          <boxGeometry args={[1, 4, 1]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>
        <mesh position={[-3, -1, -3]} castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#111111" roughness={1} />
        </mesh>
      </group>
      <fog attach="fog" args={["#0a0a0a", 5, 20]} />
    </>
  );
}

// --------------------------------------------------------
// Main Application Component
// --------------------------------------------------------
export function App() {
  const { status, setStatus, lobbyRoom, setLobbyRoom, gameRoom, setGameRoom } = useGameStore();
  const setAvailableRooms = useGameStore(state => state.setAvailableRooms);
  
  // Local preferences
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("blindspot_name") || "");
  
  // UI State
  const [activeTab, setActiveTab] = useState<"CREATE" | "JOIN">("CREATE");
  const [gameMode, setGameMode] = useState("Different Reality");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localGameStatus, setLocalGameStatus] = useState<string>(GameStatus.WAITING);

  useEffect(() => {
    localStorage.setItem("blindspot_name", playerName);
  }, [playerName]);

  useEffect(() => {
    setStatus("connecting_lobby");
    joinLobbyRoom()
      .then((room) => {
        setLobbyRoom(room);
        setStatus("in_lobby");

        room.onMessage("rooms", (rooms) => setAvailableRooms(rooms));
        room.onMessage("+", ([roomId, roomInfo]) => {
          const prev = useGameStore.getState().availableRooms;
          const exists = prev.find(r => r.roomId === roomId);
          setAvailableRooms(exists ? prev.map(r => r.roomId === roomId ? roomInfo : r) : [...prev, roomInfo]);
        });
        room.onMessage("-", (roomId) => {
          const prev = useGameStore.getState().availableRooms;
          setAvailableRooms(prev.filter(r => r.roomId !== roomId));
        });
      })
      .catch(() => {
        setStatus("error");
      });

    return () => { lobbyRoom?.leave(); };
  }, []);

  const handleCreate = async () => {
    if (!playerName.trim()) return setError("Display name required.");
    setError(null);
    setIsLoading(true);
    
    try {
      const room = await createGameRoom(playerName, gameMode);
      setupGameRoom(room);
    } catch (e: any) {
      setError(e.message || "Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (id: string = roomCode) => {
    if (!playerName.trim()) return setError("Display name required.");
    if (!id.trim()) return setError("Room code required.");
    
    setError(null);
    setIsLoading(true);

    try {
      const room = await joinGameRoom(id, playerName);
      setupGameRoom(room);
    } catch (e: any) {
      setError(e.message || "Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = () => {
    if (gameRoom) {
      gameRoom.leave();
      setGameRoom(null);
      setStatus("in_lobby");
    }
  };

  const setupGameRoom = (room: any) => {
    room.onMessage("player_join", (data: any) => console.log("Player joined:", data));
    room.onMessage("player_leave", (data: any) => console.log("Player left:", data));
    room.onMessage("game_state_changed", (data: any) => console.log("Game state changed:", data));
    room.onMessage("PANIC_STARTED", (data: any) => console.log("Panic started:", data));
    room.onMessage("PANIC_VICTORY", (data: any) => console.log("Panic victory:", data));
    room.onMessage("PANIC_FAILURE", (data: any) => console.log("Panic failure:", data));
    room.onMessage("PANIC_PHASE_CHANGED", (data: any) => console.log("Panic phase changed:", data));

    setLocalGameStatus(room.state.gameStatus);
    room.state.listen("gameStatus", (status: string) => {
      setLocalGameStatus(status);
    });

    setGameRoom(room);
    setStatus("in_game");
  };

  if (status === "in_game" && gameRoom) {
    if (localGameStatus === GameStatus.PLAYING || localGameStatus === GameStatus.STARTING) {
      return <ActiveGameView room={gameRoom} />;
    }
    return <GameLobbyView room={gameRoom} onLeave={handleLeave} />;
  }

  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
          <LandingScene />
        </Canvas>
      </div>

      <div className="landing-overlay">
        <div className="content-left">
          <h1 className="title-main">Blind Spot</h1>
          <p className="subtitle">Same room. Different view.</p>
          <p className="description">
            A cooperative 3D puzzle game where every player sees something different. Communicate to survive.
          </p>
        </div>

        <div className="content-right">
          <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", borderBottom: "1px solid var(--border-color)" }}>
            <button 
              onClick={() => { setActiveTab("CREATE"); setError(null); }}
              style={{ 
                background: "transparent", border: "none", color: activeTab === "CREATE" ? "var(--text-primary)" : "var(--text-secondary)", 
                fontFamily: "var(--font-mono)", fontSize: "1rem", padding: "1rem 0", cursor: "pointer",
                borderBottom: activeTab === "CREATE" ? "2px solid var(--accent)" : "2px solid transparent"
              }}>
              CREATE ROOM
            </button>
            <button 
              onClick={() => { setActiveTab("JOIN"); setError(null); }}
              style={{ 
                background: "transparent", border: "none", color: activeTab === "JOIN" ? "var(--text-primary)" : "var(--text-secondary)", 
                fontFamily: "var(--font-mono)", fontSize: "1rem", padding: "1rem 0", cursor: "pointer",
                borderBottom: activeTab === "JOIN" ? "2px solid var(--accent)" : "2px solid transparent"
              }}>
              JOIN ROOM
            </button>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>DISPLAY NAME</label>
            <input 
              type="text" 
              className="input-raw" 
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              spellCheck="false"
              maxLength={16}
            />
          </div>

          {activeTab === "CREATE" ? (
            <div style={{ marginBottom: "3rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>GAME MODE</label>
              <select 
                className="input-raw" 
                value={gameMode} 
                onChange={e => setGameMode(e.target.value)}
                style={{ width: "100%", background: "transparent", cursor: "pointer", borderBottom: "2px solid var(--border-color)" }}
              >
                <option value="Different Reality" style={{ background: "var(--bg-color)" }}>Different Reality</option>
                <option value="Team Roles" style={{ background: "var(--bg-color)" }}>Team Roles</option>
                <option value="Panic" style={{ background: "var(--bg-color)" }}>Panic</option>
              </select>
              
              <button 
                className="btn-raw accent" 
                onClick={handleCreate} 
                disabled={isLoading}
                style={{ marginTop: "3rem" }}
              >
                {isLoading ? "INITIALIZING..." : "CREATE ROOM"}
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: "3rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>ROOM CODE</label>
              <input 
                type="text" 
                className="input-raw" 
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                spellCheck="false"
              />
              
              <button 
                className="btn-raw accent" 
                onClick={() => handleJoin()} 
                disabled={isLoading}
                style={{ marginTop: "3rem" }}
              >
                {isLoading ? "CONNECTING..." : "JOIN ROOM"}
              </button>
            </div>
          )}

          {error && (
            <div style={{ color: "var(--accent)", padding: "1rem", border: "1px solid var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
              [ERROR] {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------------
// Pre-game Room Lobby
// --------------------------------------------------------
function GameLobbyView({ room, onLeave }: { room: any, onLeave: () => void }) {
  const [, setTick] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const stateChangeListener = room.onStateChange(() => setTick(t => t + 1));
    
    room.state.players.onAdd = (player: any) => {
      player.onChange = () => setTick(t => t + 1);
      setTick(t => t + 1);
    };
    
    room.state.players.onRemove = () => setTick(t => t + 1);

    room.onMessage("error", (msg: { message: string }) => {
      setErrorMsg(msg.message);
      setTimeout(() => setErrorMsg(null), 3000);
    });

    return () => stateChangeListener.clear();
  }, [room]);

  const players = Array.from(room.state.players.values()) as Player[];
  const isHost = room.sessionId === room.state.hostId;
  const myPlayer = room.state.players.get(room.sessionId);
  const myReady = myPlayer ? myPlayer.ready : false;

  const allReady = players.length > 0 && players.every(p => p.ready);
  const canStart = players.length >= 1 && players.length <= room.maxClients && allReady;

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    room.send("change_mode", { gameMode: e.target.value });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0a0a0a", color: "var(--text-primary)", padding: "4rem", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4rem" }}>
        <div>
          <h1 className="title-main" style={{ fontSize: "3rem" }}>Blind Spot</h1>
          {isHost ? (
            <div style={{ marginTop: "1rem" }}>
              <label style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginRight: "1rem" }}>MODE:</label>
              <select 
                className="input-raw" 
                value={room.state.gameMode} 
                onChange={handleModeChange}
                style={{ width: "auto", background: "transparent", cursor: "pointer", borderBottom: "2px solid var(--border-color)", padding: "0.25rem 0" }}
              >
                <option value="Different Reality" style={{ background: "var(--bg-color)" }}>Different Reality</option>
                <option value="Team Roles" style={{ background: "var(--bg-color)" }}>Team Roles</option>
                <option value="Panic" style={{ background: "var(--bg-color)" }}>Panic</option>
              </select>
            </div>
          ) : (
            <p className="subtitle">Mode: {room.state.gameMode}</p>
          )}
        </div>
        
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>ROOM CODE</p>
          <div style={{ border: "1px solid var(--border-color)", padding: "1rem 2rem", fontSize: "1.5rem", fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}>
            {room.roomId}
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <p style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "2rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          CONNECTED PERSONNEL ({players.length}/{room.maxClients})
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {players.map((p: Player) => {
            const isMe = p.playerId === room.sessionId;
            const isThisHost = p.playerId === room.state.hostId;
            return (
              <li key={p.playerId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: "1px dashed #222", color: p.connected ? "var(--text-primary)" : "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                <span>
                  {p.connected ? "[+] " : "[-] "} {p.name} {isMe ? "(YOU)" : ""} {isThisHost ? <span style={{ color: "var(--accent)", marginLeft: "0.5rem" }}>[HOST]</span> : ""}
                </span>
                <span style={{ color: p.ready ? "var(--accent)" : "var(--text-secondary)" }}>{p.ready ? "READY" : "WAITING"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {errorMsg && (
        <div style={{ color: "var(--accent)", padding: "1rem", border: "1px solid var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.875rem", marginBottom: "2rem", textAlign: "center" }}>
          [ERROR] {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
        <button className="btn-raw" onClick={onLeave} style={{ width: "auto" }}>SEVER CONNECTION</button>
        
        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            className={`btn-raw ${myReady ? '' : 'accent'}`} 
            onClick={() => room.send("ready", { ready: !myReady })} 
            style={{ width: "auto", background: myReady ? "transparent" : "" }}
          >
            {myReady ? "CANCEL READY" : "TOGGLE READY"}
          </button>

          {isHost && (
            <button 
              className="btn-raw accent" 
              onClick={() => room.send("start_game")} 
              disabled={!canStart}
              style={{ width: "auto", opacity: canStart ? 1 : 0.5 }}
            >
              START GAME
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

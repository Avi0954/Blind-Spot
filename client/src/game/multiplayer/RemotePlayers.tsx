import { useState, useEffect } from "react";
import { Room } from "colyseus.js";
import { Player } from "@blind-spot/shared";
import { RemotePlayer } from "./RemotePlayer";

export function RemotePlayers({ room }: { room: Room }) {
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());

  useEffect(() => {
    // Setup reactive map syncing
    const updatePlayers = () => {
      // React needs a new Map reference to trigger re-render
      setPlayers(new Map(room.state.players));
    };

    // Listen to players added/removed
    room.state.players.onAdd = updatePlayers;
    room.state.players.onRemove = updatePlayers;

    // Initial state
    updatePlayers();

    return () => {
      // Cleanup listeners
      room.state.players.onAdd = undefined;
      room.state.players.onRemove = undefined;
    };
  }, [room]);

  return (
    <>
      {Array.from(players.entries()).map(([sessionId, player]) => {
        // Do not render the local player!
        if (sessionId === room.sessionId) return null;
        
        return <RemotePlayer key={sessionId} player={player} />;
      })}
    </>
  );
}

import { useState, useEffect } from "react";
import { Room } from "colyseus.js";
import { Player } from "@blind-spot/shared";
import { RemotePlayer } from "./RemotePlayer";

export function RemotePlayers({ room }: { room: Room }) {
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [typingPlayers, setTypingPlayers] = useState<Set<string>>(new Set());
  const [quickMessages, setQuickMessages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Setup reactive map syncing
    const updatePlayers = () => {
      // React needs a new Map reference to trigger re-render
      setPlayers(new Map(room.state.players));
    };

    // Listen to players added/removed
    room.state.players.onAdd = updatePlayers;
    room.state.players.onRemove = updatePlayers;

    // Listen to typing status
    room.onMessage("typing_start", (message) => {
      setTypingPlayers((prev) => new Set(prev).add(message.playerId));
    });

    room.onMessage("typing_stop", (message) => {
      setTypingPlayers((prev) => {
        const next = new Set(prev);
        next.delete(message.playerId);
        return next;
      });
    });

    room.onMessage("chat_received", (message) => {
      if (message.type === "quick") {
        const text = room.state.chat.find((c: any) => c.id === message.id)?.text;
        if (text) {
          setQuickMessages(prev => {
            const next = new Map(prev);
            next.set(message.senderId, text);
            return next;
          });
          
          setTimeout(() => {
            setQuickMessages(prev => {
              const next = new Map(prev);
              next.delete(message.senderId);
              return next;
            });
          }, 4000);
        }
      }
    });

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
        
        return (
          <RemotePlayer 
            key={sessionId} 
            player={player} 
            isTyping={typingPlayers.has(sessionId)} 
            quickMessage={quickMessages.get(sessionId)}
          />
        );
      })}
    </>
  );
}

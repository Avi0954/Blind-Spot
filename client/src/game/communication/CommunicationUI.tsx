import { useEffect, useRef, useState } from "react";
import { ChatMessage, GameStatus } from "@blind-spot/shared";
import { Room } from "colyseus.js";
import { AudioFeedback } from "./AudioFeedback";

export function CommunicationUI({ room }: { room: Room<any> }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial messages
    setMessages(Array.from(room.state.chat.values()));

    const onAdd = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      
      if (message.senderId !== room.sessionId) {
        AudioFeedback.playChatSound();
      }

      // Auto-show chat on new message
      setShowChat(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (!isFocused) {
        hideTimeoutRef.current = setTimeout(() => setShowChat(false), 5000);
      }
    };

    room.state.chat.onAdd = onAdd;

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [room, isFocused]);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChat]);

  // Keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isFocused) {
        setShowChat(true);
        // We delay focus slightly to ensure the input is mounted if it was completely unmounted
        setTimeout(() => {
          const input = document.getElementById("chat-input");
          if (input) input.focus();
        }, 10);
      } else if (e.key === "Escape" && isFocused) {
        const input = document.getElementById("chat-input");
        if (input) input.blur();
        setShowChat(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (text.length > 0) {
      room.send("chat_send", { text, type: "normal" });
      setInputText("");
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowChat(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    room.send("typing_start");
  };

  const handleBlur = () => {
    setIsFocused(false);
    hideTimeoutRef.current = setTimeout(() => setShowChat(false), 5000);
    room.send("typing_stop");
  };

  const stopPropagation = (e: any) => {
    if (isFocused) e.stopPropagation();
  };

  if (room.state.gameStatus !== GameStatus.PLAYING && room.state.gameStatus !== GameStatus.STARTING) {
    return null;
  }

  return (
    <div 
      style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        width: "350px",
        maxHeight: "300px",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
        zIndex: 50,
        fontFamily: "var(--font-mono)",
        opacity: showChat || isFocused ? 1 : 0.3,
        transition: "opacity 0.3s ease",
      }}
    >
      <div 
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "10px",
          background: showChat || isFocused ? "rgba(0, 0, 0, 0.5)" : "transparent",
          borderRadius: "4px",
          maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, black)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, black)",
          scrollbarWidth: "none", // Firefox
        }}
        className="hide-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            fontSize: "0.85rem",
            color: msg.type === "quick" ? "var(--accent)" : "var(--text-primary)",
            textShadow: "1px 1px 2px black"
          }}>
            <span style={{ color: "var(--text-secondary)", opacity: 0.8 }}>[{msg.senderName}]</span>{" "}
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {(showChat || isFocused) && (
        <form 
          onSubmit={handleSend} 
          style={{ marginTop: "10px", pointerEvents: "auto" }}
          onKeyDown={stopPropagation}
          onKeyUp={stopPropagation}
        >
          <input
            id="chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Press Enter to chat..."
            autoComplete="off"
            maxLength={120}
            style={{
              width: "100%",
              background: "rgba(0, 0, 0, 0.7)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              padding: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </form>
      )}
    </div>
  );
}

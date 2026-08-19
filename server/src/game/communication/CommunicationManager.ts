import { GameRoom } from "../../rooms/GameRoom";
import { ChatMessage, WorldPing } from "@blind-spot/shared";
import crypto from "crypto";

const MAX_CHAT_HISTORY = 50;
const MAX_MESSAGE_LENGTH = 120;
const CHAT_RATE_LIMIT_MS = 5000;
const CHAT_RATE_LIMIT_COUNT = 5;

const PING_COOLDOWN_MS = 2000;
const PING_EXPIRE_MS = 5000;

class PlayerCommunicationState {
  chatTimestamps: number[] = [];
  lastPingTimestamp: number = 0;
  activePingId: string | null = null;
}

export class CommunicationManager {
  private room: GameRoom;
  private playerStates: Map<string, PlayerCommunicationState> = new Map();

  constructor(room: GameRoom) {
    this.room = room;
    
    // Setup message handlers
    this.room.onMessage("chat_send", (client, message) => this.handleChat(client.sessionId, message));
    this.room.onMessage("ping_create", (client, message) => this.handlePing(client.sessionId, message));
    this.room.onMessage("typing_start", (client) => this.room.broadcast("typing_start", { playerId: client.sessionId }, { except: client }));
    this.room.onMessage("typing_stop", (client) => this.room.broadcast("typing_stop", { playerId: client.sessionId }, { except: client }));
  }

  public removePlayer(playerId: string) {
    const state = this.playerStates.get(playerId);
    if (state && state.activePingId) {
      this.room.state.pings.delete(state.activePingId);
    }
    this.playerStates.delete(playerId);
    this.room.broadcast("typing_stop", { playerId });
  }

  public update() {
    // Clean up expired pings
    const now = Date.now();
    for (const [pingId, ping] of this.room.state.pings.entries()) {
      if (ping.expiresAt <= now) {
        this.room.state.pings.delete(pingId);
      }
    }
  }

  private getPlayerState(playerId: string): PlayerCommunicationState {
    if (!this.playerStates.has(playerId)) {
      this.playerStates.set(playerId, new PlayerCommunicationState());
    }
    return this.playerStates.get(playerId)!;
  }

  private handleChat(playerId: string, payload: any) {
    const player = this.room.state.players.get(playerId);
    if (!player) return;

    if (typeof payload?.text !== "string") return;
    
    let text = payload.text.trim();
    if (text.length === 0) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      text = text.substring(0, MAX_MESSAGE_LENGTH);
    }

    const type = ["normal", "quick", "system"].includes(payload.type) ? payload.type : "normal";
    
    // Rate limit
    const state = this.getPlayerState(playerId);
    const now = Date.now();
    state.chatTimestamps = state.chatTimestamps.filter(t => now - t < CHAT_RATE_LIMIT_MS);
    
    if (state.chatTimestamps.length >= CHAT_RATE_LIMIT_COUNT) {
      console.warn(`[Communication] Rate limit exceeded for ${player.name}`);
      return; // Silently reject
    }
    state.chatTimestamps.push(now);

    const msg = new ChatMessage();
    msg.id = crypto.randomUUID();
    msg.senderId = playerId;
    msg.senderName = player.name;
    msg.text = text;
    msg.type = type;
    msg.timestamp = now;

    this.room.state.chat.push(msg);

    if (this.room.state.chat.length > MAX_CHAT_HISTORY) {
      this.room.state.chat.shift();
    }
    
    // Broadcast for immediate audio feedback
    this.room.broadcast("chat_received", { id: msg.id, senderId: msg.senderId, type: msg.type });
  }

  private handlePing(playerId: string, payload: any) {
    const player = this.room.state.players.get(playerId);
    if (!player) return;

    if (!payload || !payload.position || typeof payload.position.x !== "number" || typeof payload.position.y !== "number" || typeof payload.position.z !== "number") return;
    
    const validPingTypes = ["LOOK_HERE", "I_FOUND_SOMETHING", "COME_HERE", "DANGER", "OBJECTIVE"];
    const type = validPingTypes.includes(payload.type) ? payload.type : "LOOK_HERE";

    const state = this.getPlayerState(playerId);
    const now = Date.now();

    if (now - state.lastPingTimestamp < PING_COOLDOWN_MS) {
      return; // Silently reject
    }
    
    state.lastPingTimestamp = now;

    // Remove old ping from this player if exists
    if (state.activePingId && this.room.state.pings.has(state.activePingId)) {
      this.room.state.pings.delete(state.activePingId);
    }

    const ping = new WorldPing();
    ping.id = crypto.randomUUID();
    ping.senderId = playerId;
    ping.senderName = player.name;
    ping.type = type;
    ping.position.x = payload.position.x;
    ping.position.y = payload.position.y;
    ping.position.z = payload.position.z;
    ping.createdAt = now;
    ping.expiresAt = now + PING_EXPIRE_MS;

    this.room.state.pings.set(ping.id, ping);
    state.activePingId = ping.id;
    
    this.room.broadcast("ping_received", { id: ping.id, senderId: ping.senderId, type: ping.type });
  }
}

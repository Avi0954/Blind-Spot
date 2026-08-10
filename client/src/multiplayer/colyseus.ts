import * as Colyseus from "colyseus.js";
import { GameState } from "@blind-spot/shared";

// Connect to local server during dev, or production URL
const ENDPOINT = import.meta.env.VITE_SERVER_URL || "ws://localhost:2567";

export const client = new Colyseus.Client(ENDPOINT);

export async function joinGameRoom() {
  try {
    const room = await client.joinOrCreate<GameState>("game_room");
    console.log("Joined successfully!", room.sessionId);
    return room;
  } catch (e) {
    console.error("Join error", e);
    throw e;
  }
}

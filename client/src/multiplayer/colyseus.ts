import * as Colyseus from "colyseus.js";
import { GameState } from "@blind-spot/shared";

// Connect to local server during dev, or production URL
const ENDPOINT = import.meta.env.VITE_SERVER_URL || "ws://localhost:2567";

export const client = new Colyseus.Client(ENDPOINT);

export async function joinLobbyRoom() {
  try {
    const room = await client.joinOrCreate("lobby");
    console.log("Joined lobby successfully!");
    return room;
  } catch (e) {
    console.error("Lobby join error", e);
    throw e;
  }
}

export async function createGameRoom(playerName: string, gameMode: string) {
  try {
    const room = await client.create<GameState>("game_room", { name: playerName, gameMode });
    return room;
  } catch (e: any) {
    throw new Error("Connection failed while creating room.");
  }
}

export async function joinGameRoom(roomId: string, playerName: string) {
  try {
    const room = await client.joinById<GameState>(roomId, { name: playerName });
    return room;
  } catch (e: any) {
    if (e.message.includes("not found") || e.code === 4212) {
      throw new Error("Invalid room code.");
    }
    if (e.message.includes("locked") || e.code === 4211) {
      throw new Error("Room is full.");
    }
    throw new Error("Connection failed while joining room.");
  }
}

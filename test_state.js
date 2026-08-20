import { GameState } from "./shared/dist/schemas/GameState.js";

const state = new GameState();
state.roomId = "test-room";
state.players.set("p1", { name: "Player 1" } as any);

console.log("State toJSON:", JSON.stringify(state.toJSON(), null, 2));

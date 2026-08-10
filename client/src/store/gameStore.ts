import { create } from "zustand";
import { Room } from "colyseus.js";
import { GameState } from "@blind-spot/shared";

interface GameStore {
  room: Room<GameState> | null;
  status: string;
  setRoom: (room: Room<GameState>) => void;
  setStatus: (status: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  status: "disconnected",
  setRoom: (room) => set({ room }),
  setStatus: (status) => set({ status }),
}));

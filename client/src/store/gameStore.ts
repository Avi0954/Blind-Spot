import { create } from "zustand";
import { Room } from "colyseus.js";
import { GameState } from "@blind-spot/shared";

// Extracted schema types to pure objects for React reactivity
export interface RoomInfo {
  roomId: string;
  clients: number;
  maxClients: number;
  metadata?: any;
}

interface GameStore {
  lobbyRoom: Room | null;
  gameRoom: Room<GameState> | null;
  availableRooms: RoomInfo[];
  status: string;
  activeInteractableId: string | null;
  
  // Actions
  setLobbyRoom: (room: Room) => void;
  setGameRoom: (room: Room<GameState> | null) => void;
  setAvailableRooms: (rooms: RoomInfo[]) => void;
  setStatus: (status: string) => void;
  setActiveInteractableId: (id: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  lobbyRoom: null,
  gameRoom: null,
  availableRooms: [],
  status: "disconnected",
  activeInteractableId: null,
  
  setLobbyRoom: (room) => set({ lobbyRoom: room }),
  setGameRoom: (room) => set({ gameRoom: room }),
  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),
  setStatus: (status) => set({ status }),
  setActiveInteractableId: (id) => set({ activeInteractableId: id }),
}));

import { Player, InteractableState, GameState } from "@blind-spot/shared";
import { GameRoom } from "../../rooms/GameRoom";

export interface InteractionContext {
  player: Player;
  interactable: InteractableState;
  room: GameRoom;
  state: GameState;
  timestamp: number;
  payload?: any;
}

export enum InteractionResult {
  SUCCESS = "SUCCESS",
  INVALID_PLAYER = "INVALID_PLAYER",
  NOT_IN_ROOM = "NOT_IN_ROOM",
  PLAYER_INACTIVE = "PLAYER_INACTIVE",
  OBJECT_NOT_FOUND = "OBJECT_NOT_FOUND",
  OUT_OF_RANGE = "OUT_OF_RANGE",
  NOT_PERMITTED = "NOT_PERMITTED",
  INVALID_GAME_STATE = "INVALID_GAME_STATE",
  COOLDOWN = "COOLDOWN",
  ALREADY_USED = "ALREADY_USED",
  BUSY = "BUSY",
}

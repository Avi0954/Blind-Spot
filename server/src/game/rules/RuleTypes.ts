import { GameState, Player, InteractableState } from "@blind-spot/shared";
import { GameRoom } from "../../rooms/GameRoom";

export type GameModeId = "DIFFERENT_REALITY" | "TEAM_ROLES" | "PANIC" | string;

export interface GameConfiguration {
  modes: GameModeId[];
  // puzzle configs, etc. can be added here later
}

export type RuleOutcome = "ALLOW" | "DENY" | "MODIFY" | "PASS";

export interface RuleResult<T = unknown> {
  outcome: RuleOutcome;
  value?: T;
  reason?: string;
  priority?: number;
}

export type RuleType = "INTERACTION" | "PERCEPTION" | "TIMER" | "PUZZLE" | "ENVIRONMENT";

export interface RuleContext {
  player?: Player;
  object?: InteractableState;
  room: GameRoom;
  gameState: GameState;
}

export interface ModeRule {
  id: string;
  modeId: GameModeId;
  priority: number;
  type: RuleType;
  evaluate(context: RuleContext): RuleResult;
}

export interface ModeRules {
  perception?: ModeRule[];
  roles?: ModeRule[];
  interactions?: ModeRule[];
  timers?: ModeRule[];
  puzzles?: ModeRule[];
  environment?: ModeRule[];
}

export interface ModeContext {
  room: GameRoom;
  gameState: GameState;
  // Additional managers can be exposed here as needed, but they are accessible via room anyway
}

import { GameModeId, ModeContext, ModeRules } from "../rules/RuleTypes";
import { Player } from "@blind-spot/shared";

export interface GameMode {
  id: GameModeId;
  priority: number;

  registerRules(context: ModeContext): ModeRules;
  
  initialize?(context: ModeContext): void;
  onGameStart?(context: ModeContext): void;
  onGameEnd?(context: ModeContext): void;
  onPlayerJoin?(context: ModeContext, player: Player): void;
  onPlayerLeave?(context: ModeContext, player: Player): void;
}

export class GameModeRegistry {
  private modes = new Map<GameModeId, GameMode>();

  public register(mode: GameMode): void {
    if (this.modes.has(mode.id)) {
      console.warn(`[GameModeRegistry] Overwriting mode ${mode.id}`);
    }
    this.modes.set(mode.id, mode);
  }

  public get(id: GameModeId): GameMode {
    const mode = this.modes.get(id);
    if (!mode) {
      throw new Error(`[GameModeRegistry] Mode ${id} not found.`);
    }
    return mode;
  }

  public resolve(ids: GameModeId[]): GameMode[] {
    return ids
      .map(id => this.get(id))
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.id.localeCompare(b.id);
      });
  }
}

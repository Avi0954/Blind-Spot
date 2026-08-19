import { GameMode } from "../GameModeRegistry";
import { GameModeId, ModeContext, ModeRules, RuleContext, RuleResult } from "../../rules/RuleTypes";
import { GameStatus } from "@blind-spot/shared";

export class PanicMode implements GameMode {
  public id: GameModeId = "PANIC";
  public priority = 200;

  public initialize(_context: ModeContext): void {
    // We could initialize specific state here if needed
  }

  public onGameStart(context: ModeContext): void {
    if (context.room.panicManager) {
      context.room.panicManager.startPanic(180000);
    }
  }

  public onGameEnd(context: ModeContext): void {
    if (context.gameState.gameStatus === GameStatus.COMPLETED) {
      context.room.panicManager?.completePanic();
    } else if (context.gameState.gameStatus === GameStatus.FAILED) {
      context.room.panicManager?.failPanic();
    }
  }

  public registerRules(_context: ModeContext): ModeRules {
    return {
      interactions: [
        {
          id: "panic-disabled-during",
          modeId: this.id,
          priority: 200, // Higher priority than Team Roles (100)
          type: "INTERACTION",
          evaluate: (ctx: RuleContext): RuleResult => {
            if (ctx.object && ctx.object.panicConfig && ctx.object.panicConfig !== "{}" && ctx.object.panicConfig !== "") {
              try {
                const config = JSON.parse(ctx.object.panicConfig);
                if (config.disabledDuring && Array.isArray(config.disabledDuring)) {
                  if (config.disabledDuring.includes(ctx.gameState.panic.phase)) {
                    return { outcome: "DENY", reason: "BUSY_DUE_TO_PANIC_PHASE" };
                  }
                }
              } catch (e) {
                // Ignore parse errors here, logged elsewhere
              }
            }
            return { outcome: "PASS" };
          }
        }
      ]
    };
  }
}

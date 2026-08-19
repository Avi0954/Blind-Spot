import { GameMode } from "../GameModeRegistry";
import { GameModeId, ModeContext, ModeRules, RuleContext, RuleResult } from "../../rules/RuleTypes";

export class DifferentRealityMode implements GameMode {
  public id: GameModeId = "DIFFERENT_REALITY";
  public priority = 100;

  public registerRules(_context: ModeContext): ModeRules {
    return {
      perception: [
        {
          id: "dr-perception-fallback",
          modeId: this.id,
          priority: 10,
          type: "PERCEPTION",
          evaluate: (ctx: RuleContext): RuleResult => {
            // In Different Reality, objects WITHOUT a required perception are visible to everyone
            if (ctx.object && !ctx.object.requiredPerception) {
              return { outcome: "ALLOW", reason: "NO_PERCEPTION_REQUIREMENT" };
            }
            return { outcome: "PASS" };
          }
        }
      ]
    };
  }
}

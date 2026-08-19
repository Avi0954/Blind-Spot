import { GameMode } from "../GameModeRegistry";
import { GameModeId, ModeContext, ModeRules, RuleContext, RuleResult } from "../../rules/RuleTypes";
import { ROLE_DEFINITIONS, RoleType } from "@blind-spot/shared";

export class TeamRolesMode implements GameMode {
  public id: GameModeId = "TEAM_ROLES";
  public priority = 100;

  public registerRules(_context: ModeContext): ModeRules {
    return {
      perception: [
        {
          id: "tr-perception-ability",
          modeId: this.id,
          priority: 50,
          type: "PERCEPTION",
          evaluate: (ctx: RuleContext): RuleResult => {
            if (ctx.object && ctx.object.requiredPerception && ctx.player) {
              const roleDef = ROLE_DEFINITIONS[ctx.player.role as RoleType];
              if (roleDef && roleDef.abilities.includes(ctx.object.requiredPerception as any)) {
                return { outcome: "ALLOW", reason: "ROLE_PERCEPTION_AUTHORIZED" };
              }
              // It explicitly requires perception that we don't have.
              // Note: We could return DENY here if we wanted to strictly hide it, 
              // but PASS allows other modes (if any) to decide, or fall back to system default (hidden).
              // Let's return DENY to enforce the role restriction strictly.
              return { outcome: "DENY", reason: "ROLE_PERCEPTION_UNAUTHORIZED" };
            }
            return { outcome: "PASS" };
          }
        }
      ],
      interactions: [
        {
          id: "tr-interaction-ability",
          modeId: this.id,
          priority: 50,
          type: "INTERACTION",
          evaluate: (ctx: RuleContext): RuleResult => {
            if (ctx.object && ctx.object.requiredAbility && ctx.player) {
              const roleDef = ROLE_DEFINITIONS[ctx.player.role as RoleType];
              if (!roleDef || !roleDef.abilities.includes(ctx.object.requiredAbility as any)) {
                return { outcome: "DENY", reason: "UNAUTHORIZED_ROLE" };
              }
              return { outcome: "ALLOW", reason: "AUTHORIZED_ROLE" };
            }
            return { outcome: "PASS" };
          }
        }
      ]
    };
  }
}

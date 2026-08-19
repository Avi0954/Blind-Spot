import { ModeRule, RuleContext, RuleResult, RuleType } from "./RuleTypes";

export class RuleEngine {
  private rules: ModeRule[] = [];

  public register(rule: ModeRule): void {
    this.rules.push(rule);
  }

  public registerAll(rules: ModeRule[]): void {
    this.rules.push(...rules);
  }

  public clear(): void {
    this.rules = [];
  }

  /**
   * Evaluates a specific type of event/action through the rule pipeline.
   * Resolves conflicts deterministically.
   */
  public evaluate(type: RuleType, context: RuleContext): RuleResult {
    // 1. Filter rules by type
    const applicableRules = this.rules.filter(r => r.type === type);

    // 2. Sort deterministically:
    // Highest priority first
    // If priority equal, modeId lexical sort
    // If modeId equal, ruleId lexical sort
    applicableRules.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.modeId !== b.modeId) return a.modeId.localeCompare(b.modeId);
      return a.id.localeCompare(b.id);
    });

    // 3. Evaluate rules and collect results
    const results: RuleResult[] = [];
    for (const rule of applicableRules) {
      results.push(rule.evaluate(context));
    }

    // 4. Resolve conflicts
    return this.resolveConflicts(results);
  }

  /**
   * Conflict Resolution Hierarchy:
   * 1. If ANY rule returns DENY -> DENY (Hard constraint, safety, failure overrides permission)
   * 2. If NO DENY, but ANY rule returns ALLOW -> ALLOW
   * 3. Otherwise -> PASS (fall back to system default)
   */
  private resolveConflicts(results: RuleResult[]): RuleResult {
    const defaultResult: RuleResult = { outcome: "PASS" };
    if (results.length === 0) return defaultResult;

    // Check for DENY
    const denyResults = results.filter(r => r.outcome === "DENY");
    if (denyResults.length > 0) {
      // Return the most important DENY reason based on the sorted order (first one)
      return denyResults[0];
    }

    // Check for ALLOW
    const allowResults = results.filter(r => r.outcome === "ALLOW");
    if (allowResults.length > 0) {
      return allowResults[0];
    }

    // Check for MODIFY (often used for data transformation like Perception modifying visibility)
    // Actually for perception we usually treat ALLOW as "can see", DENY as "hidden". 
    // MODIFY could be "distorted". We'll just return the first MODIFY if no ALLOW/DENY.
    const modifyResults = results.filter(r => r.outcome === "MODIFY");
    if (modifyResults.length > 0) {
      return modifyResults[0];
    }

    return defaultResult;
  }
}

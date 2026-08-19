import { LevelDefinition } from "@blind-spot/shared";
import { createSeededRNG } from "@blind-spot/shared/src/generation/SeededRNG";
import { deriveSeed } from "@blind-spot/shared/src/generation/SeedDerivation";
import { GameModeId } from "../rules/RuleTypes";
import { PuzzleGenerator } from "./PuzzleGenerator";

const MAX_ATTEMPTS = 100;

export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationError";
  }
}

export class GameGenerator {
  public static generate(
    baseSeed: string,
    levelDef: LevelDefinition,
    activeModes: GameModeId[]
  ): LevelDefinition {
    // We clone the definition because we will mutate it to form the generated level
    const generatedLevel: LevelDefinition = JSON.parse(JSON.stringify(levelDef));
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const attemptSeed = deriveSeed(baseSeed, `attempt:${attempt}`);
      
      try {
        // 1. Generate Roles
        // We skip full role generator for MVP since roles are picked in lobby, but we could enforce puzzle requirements here.
        
        // 2. Generate Puzzles and modify clues
        const puzzleRng = createSeededRNG(deriveSeed(attemptSeed, "puzzles"));
        PuzzleGenerator.generate(puzzleRng, generatedLevel);

        // 3. Generate Objects (if we had object variation groups)
        // ObjectVariationGenerator.generate(createSeededRNG(deriveSeed(attemptSeed, "objects")), generatedLevel);

        // 4. Validate
        this.validateConfiguration(generatedLevel, activeModes);

        // Success!
        return generatedLevel;
      } catch (err: any) {
        // If validation fails or puzzle generation throws a constraint error, we just continue the loop
        console.warn(`Generation attempt ${attempt} failed:`, err.message);
      }
    }

    throw new GenerationError(`Unable to generate valid level configuration after ${MAX_ATTEMPTS} attempts.`);
  }

  private static validateConfiguration(level: LevelDefinition, modes: GameModeId[]) {
    // We must ensure the puzzle can be solved.
    // For now, assume PuzzleGenerator handles solvability validation for its own puzzles.
    // We would cross-validate here if we needed to (e.g., PANIC time limit check).
    // Let's do a simple check:
    if (modes.includes("PANIC")) {
      // If PANIC is active, ensure we don't have something that's strictly impossible.
      // (Mock validation: all puzzles must have at least one required interaction)
      for (const puzzle of level.puzzles) {
        if (puzzle.type === "multiplayer" && (!puzzle.configuration || !puzzle.configuration.targetObject)) {
          throw new Error(`Puzzle ${puzzle.id} requires a targetObject in PANIC mode.`);
        }
      }
    }
  }
}

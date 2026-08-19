import { LevelDefinition, PuzzleDefinition, InteractableDefinition } from "@blind-spot/shared";
import { SeededRNG } from "@blind-spot/shared/src/generation/SeededRNG";

export class PuzzleGenerator {
  public static generate(rng: SeededRNG, level: LevelDefinition) {
    for (const puzzle of level.puzzles) {
      if (!puzzle.variation) continue;

      if (puzzle.id === "reality_puzzle_01" && puzzle.variation.symbols?.enabled && puzzle.variation.numbers?.enabled) {
        this.generateRealityPuzzle01(rng, puzzle, level.interactables);
      }
    }
  }

  private static generateRealityPuzzle01(rng: SeededRNG, puzzle: PuzzleDefinition, interactables: InteractableDefinition[]) {
    const symbolPool = puzzle.variation?.symbols?.pool || ["▲", "○", "□", "★", "◇"];
    const count = puzzle.variation?.symbols?.count || 4;
    const min = puzzle.variation?.numbers?.min || 1;
    const max = puzzle.variation?.numbers?.max || 9;

    // Pick unique symbols for the mapping
    const mappingSymbols = rng.shuffle(symbolPool).slice(0, 3); // We need 3 unique symbols for the translation key
    
    // Assign a unique number to each symbol
    const assignedNumbers = new Set<number>();
    const symbolToNumber = new Map<string, number>();
    
    for (const sym of mappingSymbols) {
      let num = rng.integer(min, max);
      while (assignedNumbers.has(num)) {
        num = rng.integer(min, max);
      }
      assignedNumbers.add(num);
      symbolToNumber.set(sym, num);
    }

    // Generate the required sequence (allow repeats in the sequence)
    const sequenceSymbols: string[] = [];
    const sequenceNumbers: number[] = [];
    for (let i = 0; i < count; i++) {
      const sym = rng.pick(mappingSymbols);
      sequenceSymbols.push(sym);
      sequenceNumbers.push(symbolToNumber.get(sym)!);
    }

    // Select the correct terminal
    const potentialTerminals = ["terminal_a", "terminal_b", "terminal_c"];
    const targetTerminal = rng.pick(potentialTerminals);

    // Update puzzle state
    puzzle.configuration = puzzle.configuration || {};
    puzzle.configuration.targetObject = targetTerminal;
    puzzle.solution = { sequence: sequenceNumbers };

    // Update Clues
    const symbolClue = interactables.find(i => i.id === "symbol_panel_01");
    if (symbolClue) {
      symbolClue.metadata = JSON.stringify({ clue: sequenceSymbols.join("  "), title: "HIDDEN SYMBOLS" });
    }

    const decoderClue = interactables.find(i => i.id === "decoder_panel_01");
    if (decoderClue) {
      const mappingStr = mappingSymbols.map(sym => `${sym}=${symbolToNumber.get(sym)}`).join("  ");
      decoderClue.metadata = JSON.stringify({ clue: mappingStr, title: "TRANSLATION KEY" });
    }

    const mapClue = interactables.find(i => i.id === "navigator_map_01");
    if (mapClue) {
      let targetName = targetTerminal.split("_")[1].toUpperCase();
      mapClue.metadata = JSON.stringify({ clue: `POWER RELAY IS ROUTED TO TERMINAL ${targetName} ONLY`, title: "FACILITY MAP" });
    }

    // Ensure only the target terminal is real, others will fail the sequence in Puzzle implementation
    // Wait, the Puzzle implementation currently checks if the interacted object is targetObject.
    // So we don't need to change the terminal configs, just the targetObject string!
  }
}

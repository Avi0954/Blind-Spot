import { LevelLoader, LevelRegistry, LevelDefinition } from "@blind-spot/shared";
import { GameRoom } from "../../rooms/GameRoom";
import { InteractableState, Vector3 } from "@blind-spot/shared";

export class LevelManager {
  private room: GameRoom;
  private loader: LevelLoader;
  private currentLevel?: LevelDefinition;

  constructor(room: GameRoom) {
    this.room = room;
    // Create the global level registry from shared library
    const registry = new LevelRegistry();
    this.loader = new LevelLoader(registry);
  }

  public async load(levelId: string): Promise<void> {
    const definition = this.loader.load(levelId);
    this.currentLevel = definition;
    
    // Set network state
    this.room.state.activeLevelId = definition.id;
    this.room.state.gameMode = definition.modes ? definition.modes.join(" + ") : "";
    
    // Clear old state
    this.room.state.interactables.clear();
    this.room.state.puzzles.clear();
    
    // Re-initialize modes based on level config
    const modeIds = definition.modes || [];
    this.room.state.activeModes.clear();
    modeIds.forEach(id => this.room.state.activeModes.push(id));
    this.room.initializeModes(modeIds);
    
    // Populate interactables
    for (const def of definition.interactables) {
      const state = new InteractableState();
      state.id = def.id;
      state.type = def.type;
      state.position = new Vector3(def.position[0], def.position[1], def.position[2]);
      state.interactionRange = def.interactionRange;
      
      if (def.initialState?.state) {
        state.state = def.initialState.state as string;
      } else {
        state.state = "idle";
      }
      
      if (def.requiredAbility) state.requiredAbility = def.requiredAbility;
      if (def.requiredPerception) state.requiredPerception = def.requiredPerception;
      if (def.panicConfig) state.panicConfig = def.panicConfig;
      if (def.metadata) state.metadata = def.metadata;
      if (def.enabled !== undefined) state.enabled = def.enabled;
      
      this.room.state.interactables.set(state.id, state);
    }
    
    // Populate puzzles
    if (definition.puzzles.length > 0) {
      this.room.puzzleManager.loadPuzzles(definition.puzzles);
    }

    // Force players to respawn or adjust? For MVP, we'll let existing logic handle positions or reset them later if needed.
    // Re-evaluate perception
    this.room.perceptionManager.recalculateAll();
  }

  public getCurrentLevel(): LevelDefinition | undefined {
    return this.currentLevel;
  }
}

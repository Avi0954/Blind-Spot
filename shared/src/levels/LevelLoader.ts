import { LevelDefinition } from "./LevelDefinition";
import { observationRoom } from "./definitions/level01";
import { storageRoom } from "./definitions/level02";
import { machineRoom } from "./definitions/level03";
import { distortionRoom } from "./definitions/level04";
import { controlRoom } from "./definitions/level05";
import { testRoom } from "./definitions/testRoom";

export class LevelRegistry {
  private levels = new Map<string, LevelDefinition>();

  constructor() {
    this.register(observationRoom);
    this.register(storageRoom);
    this.register(machineRoom);
    this.register(distortionRoom);
    this.register(controlRoom);
    this.register(testRoom);
  }

  public register(level: LevelDefinition) {
    if (this.levels.has(level.id)) {
      throw new Error(`Duplicate level: ${level.id}`);
    }
    this.levels.set(level.id, level);
  }

  public get(id: string): LevelDefinition | undefined {
    return this.levels.get(id);
  }

  public getAll(): LevelDefinition[] {
    return Array.from(this.levels.values());
  }
}

export class LevelLoader {
  private registry: LevelRegistry;

  constructor(registry: LevelRegistry) {
    this.registry = registry;
  }

  public load(levelId: string): LevelDefinition {
    const level = this.registry.get(levelId);
    if (!level) {
      throw new Error(`Level not found: ${levelId}`);
    }
    return level;
  }
}

// GameModeId is represented as string in the configuration for now

export interface LightingDefinition {
  profile: string;
}

export interface AudioDefinition {
  ambient: string;
}

export interface AtmosphereDefinition {
  fog: string;
}

export interface MachineryDefinition {
  id: string;
}

export interface DoorDefinition {
  id: string;
}

export interface EnvironmentDefinition {
  scene: string;
  lighting?: LightingDefinition;
  audio?: AudioDefinition;
  atmosphere?: AtmosphereDefinition;
  machinery?: MachineryDefinition[];
  doors?: DoorDefinition[];
}

export interface SpawnPointDefinition {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  team?: string;
  role?: string;
}

export interface ObjectDefinition {
  id: string;
  type: string;
  asset: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  properties?: Record<string, unknown>;
  color?: string; // specific to current MVP objects
}

export interface PermissionDefinition {
  ability?: string;
}

export interface InteractableDefinition {
  id: string;
  type: string; // e.g. "keypad", "door", "clue"
  position: [number, number, number];
  rotation?: [number, number, number];
  interactionRange: number;
  permissions?: PermissionDefinition[];
  initialState?: Record<string, unknown>;
  interactionRules?: string[];
  puzzleBinding?: string;
  asset?: string;
  requiredAbility?: string;
  requiredPerception?: string;
  panicConfig?: string;
  metadata?: string;
  enabled?: boolean;
}

export interface SymbolVariationConfig {
  enabled: boolean;
  count?: number;
  pool?: string[];
}

export interface NumberVariationConfig {
  enabled: boolean;
  min?: number;
  max?: number;
}

export interface ClueVariationConfig {
  enabled: boolean;
}

export interface PuzzleVariationConfig {
  symbols?: SymbolVariationConfig;
  numbers?: NumberVariationConfig;
  clues?: ClueVariationConfig;
}

export interface PuzzleDefinition {
  id: string;
  type: "SEQUENCE" | "NUMBER" | "SYMBOL" | "POSITION" | "MULTIPLAYER" | string;
  configuration: Record<string, unknown>;
  variation?: PuzzleVariationConfig;
  solution?: unknown;
  requiredInteractions?: string[];
  requiredRoles?: string[];
  perception?: string[];
  completionEffects?: string[];
}

export interface ConditionDefinition {
  type: string;
  key?: string;
}

export interface PerceptionRuleDefinition {
  id: string;
  target: string;
  effect: "VISIBLE" | "HIDDEN" | "DISTORTED" | "REPLACED" | "REVEALED";
  players?: string[];
  roles?: string[];
  conditions?: ConditionDefinition[];
}

export interface LevelRoleDefinition {
  id: string;
  name: string;
  permissions?: string[];
  puzzleCapabilities?: string[];
  spawnPoint?: string;
  required?: boolean;
}

export interface WinConditionDefinition {
  type: "PUZZLE_COMPLETED" | "ALL_PUZZLES_COMPLETED" | "INTERACTION_COMPLETED" | "OBJECTIVE_COMPLETED" | "CUSTOM";
  targetIds?: string[];
  configuration?: Record<string, unknown>;
}

export interface FailureConditionDefinition {
  type: "NONE" | "TIMER_EXPIRED" | "OBJECT_DESTROYED" | "PUZZLE_FAILED" | "CUSTOM";
  targetIds?: string[];
  configuration?: Record<string, unknown>;
}

export interface LevelDefinition {
  id: string;
  name: string;
  environment: EnvironmentDefinition;
  spawnPoints: SpawnPointDefinition[];
  objects: ObjectDefinition[];
  interactables: InteractableDefinition[];
  puzzles: PuzzleDefinition[];
  perceptionRules: PerceptionRuleDefinition[];
  roles: LevelRoleDefinition[];
  winCondition: WinConditionDefinition;
  failureCondition: FailureConditionDefinition;
  modes?: string[]; // GameModeId
  metadata?: Record<string, unknown>;
}

export interface LevelReference {
  id: string;
}

export interface FacilityConnection {
  id: string;
  from: string;
  to: string;
  type: string;
  requirements?: ConditionDefinition[];
}

export interface FacilityEnvironment {
  // global environment config
}

export interface FacilityDefinition {
  id: string;
  name: string;
  levels: LevelReference[];
  connections: FacilityConnection[];
  environment: FacilityEnvironment;
}

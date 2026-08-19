import { LevelDefinition } from "../LevelDefinition";

export const observationRoom: LevelDefinition = {
  id: "level-01",
  name: "Observation Room",
  environment: {
    scene: "observation-room",
    lighting: { profile: "facility" },
    audio: { ambient: "observation-room" },
  },
  spawnPoints: [
    {
      id: "spawn-a",
      position: [0, 0, 5],
      rotation: [0, Math.PI, 0]
    }
  ],
  objects: [
    {
      id: "table_01",
      type: "PROP",
      asset: "table",
      position: [2, 0, 0]
    }
  ],
  interactables: [
    {
      id: "door_01",
      type: "door",
      position: [0, 0, -5],
      interactionRange: 3.0,
      initialState: { state: "locked" },
      enabled: false
    },
    {
      id: "terminal_a",
      type: "keypad",
      position: [-4.9, 1.5, -3],
      interactionRange: 2.0,
      requiredAbility: "OPERATE_MACHINE",
      panicConfig: JSON.stringify({ disabledDuring: ["EMERGENCY"] })
    },
    {
      id: "terminal_b",
      type: "keypad",
      position: [0, 1.5, -4.9],
      interactionRange: 2.0,
      requiredAbility: "OPERATE_MACHINE"
    },
    {
      id: "terminal_c",
      type: "keypad",
      position: [4.9, 1.5, -3],
      interactionRange: 2.0,
      requiredAbility: "OPERATE_MACHINE",
      panicConfig: JSON.stringify({ disabledDuring: ["EMERGENCY"] })
    },
    {
      id: "symbol_panel_01",
      type: "clue",
      position: [-4.9, 1.5, 0],
      interactionRange: 3.0,
      requiredPerception: "SEE_HIDDEN_CLUE",
      metadata: JSON.stringify({ clue: "▲  ○  □  ○", title: "HIDDEN SYMBOLS" })
    },
    {
      id: "decoder_panel_01",
      type: "clue",
      position: [4.9, 1.5, 0],
      interactionRange: 3.0,
      requiredPerception: "DECODE_SYMBOL",
      metadata: JSON.stringify({ clue: "▲=8  ○=3  □=6", title: "TRANSLATION KEY" })
    },
    {
      id: "navigator_map_01",
      type: "clue",
      position: [0, 1.5, 4.9],
      interactionRange: 3.0,
      requiredPerception: "SEE_HIDDEN_ROUTE",
      metadata: JSON.stringify({ clue: "POWER RELAY IS ROUTED TO TERMINAL B ONLY", title: "FACILITY MAP" })
    }
  ],
  puzzles: [
    {
      id: "reality_puzzle_01",
      type: "multiplayer",
      configuration: {
        playersRequired: 2,
        targetObject: "terminal_b"
      },
      solution: {
        sequence: [8, 3, 6, 3]
      }
    }
  ],
  perceptionRules: [],
  roles: [],
  winCondition: {
    type: "PUZZLE_COMPLETED",
    targetIds: ["reality_puzzle_01"]
  },
  failureCondition: {
    type: "NONE"
  },
  modes: ["DIFFERENT_REALITY", "TEAM_ROLES", "PANIC"]
};

import { LevelDefinition } from "../LevelDefinition";

export const testRoom: LevelDefinition = {
  id: "test-room",
  name: "Test Room",
  environment: {
    scene: "test-room",
  },
  spawnPoints: [
    {
      id: "spawn-a",
      position: [0, 0, 5],
      rotation: [0, Math.PI, 0]
    }
  ],
  objects: [],
  interactables: [],
  puzzles: [],
  perceptionRules: [],
  roles: [],
  winCondition: {
    type: "OBJECTIVE_COMPLETED"
  },
  failureCondition: {
    type: "NONE"
  },
  modes: []
};

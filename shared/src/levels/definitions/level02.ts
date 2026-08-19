import { LevelDefinition } from "../LevelDefinition";

export const storageRoom: LevelDefinition = {
  id: "level-02",
  name: "Storage Room",
  environment: {
    scene: "storage-room",
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
  modes: ["TEAM_ROLES"]
};

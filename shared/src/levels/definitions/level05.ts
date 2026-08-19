import { LevelDefinition } from "../LevelDefinition";

export const controlRoom: LevelDefinition = {
  id: "level-05",
  name: "Control Room",
  environment: {
    scene: "control-room",
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
    type: "TIMER_EXPIRED"
  },
  modes: ["DIFFERENT_REALITY", "TEAM_ROLES", "PANIC"]
};

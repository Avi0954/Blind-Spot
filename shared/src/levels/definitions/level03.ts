import { LevelDefinition } from "../LevelDefinition";

export const machineRoom: LevelDefinition = {
  id: "level-03",
  name: "Machine Room",
  environment: {
    scene: "machine-room",
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
  modes: ["TEAM_ROLES", "PANIC"]
};

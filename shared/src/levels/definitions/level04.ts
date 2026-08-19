import { LevelDefinition } from "../LevelDefinition";

export const distortionRoom: LevelDefinition = {
  id: "level-04",
  name: "Distortion Room",
  environment: {
    scene: "distortion-room",
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
  modes: ["DIFFERENT_REALITY", "PANIC"]
};

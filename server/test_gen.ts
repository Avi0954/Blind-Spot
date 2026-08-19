import { LevelLoader, LevelRegistry } from "@blind-spot/shared";
import { GameGenerator } from "./src/game/generation/GameGenerator";

const registry = new LevelRegistry();
const loader = new LevelLoader(registry);

try {
  const rawDefinition = loader.load("level-01");
  const definition = GameGenerator.generate("BLINDSPOT-8F3A91C2", rawDefinition, []);
  console.log("Success! Definition:", definition.id);
} catch (err: any) {
  console.error("Error generating:", err.message);
}

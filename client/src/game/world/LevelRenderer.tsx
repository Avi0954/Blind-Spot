import { useGameStore } from "../../store/gameStore";
import { EnvironmentRenderer } from "./EnvironmentRenderer";
import { Door } from "./Door";
import { Table } from "./Table";
import { InteractableObject } from "./InteractableObject";
import { LevelRegistry, LevelLoader } from "@blind-spot/shared";
import { useMemo } from "react";

export function LevelRenderer({ room }: { room: any }) {
  const activeLevelId = useGameStore((state: any) => state.gameState?.activeLevelId || "level-01");

  
  const levelData = useMemo(() => {
    const loader = new LevelLoader(new LevelRegistry());
    try {
      return loader.load(activeLevelId);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [activeLevelId]);

  if (!levelData) return null;

  return (
    <>
      <EnvironmentRenderer level={levelData} room={room} />
      
      {/* Static Objects */}
      {levelData.objects.map(obj => {
        if (obj.asset === "table") {
          return <Table key={obj.id} position={obj.position} rotation={obj.rotation || [0,0,0]} />;
        }
        return null;
      })}

      {/* Interactables */}
      {levelData.interactables.map(intDef => {
        // If it doesn't exist yet, it will eventually when the server state syncs.
        
        if (intDef.type === "door") {
          return (
            <Door 
              key={intDef.id} 
              position={intDef.position} 
              rotation={intDef.rotation || [0,0,0]} 
              interactableId={intDef.id} 
              room={room} 
            />
          );
        }

        // For generic interactables, we need a color representation just like we had before.
        // We'll map colors based on MVP hardcodes or if provided.
        let color = "#ffffff";
        if (intDef.id === "keypad_01" || intDef.type === "keypad") color = "#00ffcc";
        if (intDef.id === "symbol_clue_01" || intDef.id === "symbol_panel_01") color = "#cc00ff";
        if (intDef.id === "number_clue_01" || intDef.id === "decoder_panel_01" || intDef.id === "navigator_map_01") color = "#00ff00";

        return (
          <InteractableObject 
            key={intDef.id} 
            position={intDef.position} 
            color={color} 
            interactableId={intDef.id} 
            room={room} 
          />
        );
      })}
    </>
  );
}

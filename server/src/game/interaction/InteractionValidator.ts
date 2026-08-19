import { InteractionContext, InteractionResult } from "./InteractionContext";
import { GameStatus, ROLE_DEFINITIONS, RoleType } from "@blind-spot/shared";

export class InteractionValidator {
  static validate(context: InteractionContext): InteractionResult {
    const { player, interactable, state } = context;

    // 1. Player is active
    if (!player || !player.connected) {
      return InteractionResult.INVALID_PLAYER;
    }

    // 2. Object exists and is active
    if (!interactable) {
      return InteractionResult.OBJECT_NOT_FOUND;
    }

    // 3. PERCEPTION CHECK: Does the player actually perceive this object?
    const clientReality = context.room.state.clientRealities.get(player.playerId);
    if (!clientReality || !clientReality.visibleInteractables.has(interactable.id)) {
      return InteractionResult.OBJECT_NOT_FOUND; // Return not found to not leak existence
    }

    // 4. Check if enabled
    if (!interactable.enabled) {
      return InteractionResult.OBJECT_NOT_FOUND;
    }

    // 5. Distance check
    const dx = player.position.x - interactable.position.x;
    const dy = player.position.y - interactable.position.y;
    const dz = player.position.z - interactable.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > interactable.interactionRange) {
      return InteractionResult.OUT_OF_RANGE;
    }

    // 5.5 ABILITY CHECK
    if (interactable.requiredAbility) {
      const roleDef = ROLE_DEFINITIONS[player.role as RoleType];
      if (!roleDef || !roleDef.abilities.includes(interactable.requiredAbility as any)) {
        return InteractionResult.UNAUTHORIZED; 
      }
    }

    // 5.6 PANIC CONFIG CHECK
    if (interactable.panicConfig && interactable.panicConfig !== "{}" && interactable.panicConfig !== "") {
      try {
        const config = JSON.parse(interactable.panicConfig);
        if (config.disabledDuring && Array.isArray(config.disabledDuring)) {
          if (config.disabledDuring.includes(state.panic.phase)) {
            return InteractionResult.BUSY; // Or UNAUTHORIZED, but BUSY fits "temporarily offline" well
          }
        }
      } catch (e) {
        console.warn(`[InteractionValidator] Invalid panicConfig JSON on object ${interactable.id}`);
      }
    }

    // 6. Game state check
    if (state.gameStatus !== GameStatus.PLAYING && state.gameStatus !== GameStatus.STARTING) {
      return InteractionResult.INVALID_GAME_STATE;
    }
    
    // 7. Check if object is currently busy (e.g., opening door)
    if (interactable.state === "opening" || interactable.state === "closing") {
      return InteractionResult.BUSY;
    }

    return InteractionResult.SUCCESS;
  }
}

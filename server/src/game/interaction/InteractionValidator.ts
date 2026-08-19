import { InteractionContext, InteractionResult } from "./InteractionContext";

export class InteractionValidator {
  static validate(context: InteractionContext): InteractionResult {
    const { player, interactable, state } = context;

    // 1. Player is active
    if (!player || !player.connected) {
      return InteractionResult.PLAYER_INACTIVE;
    }

    // 2. Object exists and is active
    if (!interactable || !interactable.enabled) {
      return InteractionResult.OBJECT_NOT_FOUND;
    }

    // 3. Distance check
    const dx = player.position.x - interactable.position.x;
    const dy = player.position.y - interactable.position.y;
    const dz = player.position.z - interactable.position.z;
    const distanceSq = dx * dx + dy * dy + dz * dz;
    const rangeSq = interactable.interactionRange * interactable.interactionRange;

    // Add a small server tolerance (1.0m) to prevent physics micro-jitter rejection
    if (distanceSq > rangeSq + 1.0) {
      return InteractionResult.OUT_OF_RANGE;
    }

    // 4. Game state check
    if (state.gameStatus !== "playing") {
      return InteractionResult.INVALID_GAME_STATE;
    }

    // 5. Check object state (can't interact if busy or already consumed)
    if (interactable.state === "consumed" || interactable.state === "opening" || interactable.state === "closing") {
      return InteractionResult.BUSY;
    }

    return InteractionResult.SUCCESS;
  }
}

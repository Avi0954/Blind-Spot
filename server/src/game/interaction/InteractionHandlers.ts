import { InteractionContext } from "./InteractionContext";

export class InteractionHandlers {
  static handle(context: InteractionContext) {
    const { interactable } = context;

    switch (interactable.type) {
      case "door":
        this.handleDoor(context);
        break;
      case "keypad":
        this.handleKeypad(context);
        break;
      case "lever":
      case "switch":
        this.handleToggle(context);
        break;
      case "button":
        this.handleButton(context);
        break;
      case "key":
      case "inspectable":
        this.handleOneTime(context);
        break;
      default:
        console.warn(`No handler for interactable type: ${interactable.type}`);
    }
    
    // Notify puzzle manager that an interaction successfully occurred
    context.room.puzzleManager.handleEvent({
      type: "interaction.completed",
      objectId: interactable.id
    });
  }

  private static handleDoor(context: InteractionContext) {
    const { interactable } = context;
    if (interactable.state === "closed") {
      interactable.state = "opening";
      // We could use a timer to set it to "open" after animation, but for now we'll just leave it as opening -> open instantly or client animates
      setTimeout(() => {
        interactable.state = "open";
      }, 1000); // 1 second animation duration
    } else if (interactable.state === "open") {
      interactable.state = "closing";
      setTimeout(() => {
        interactable.state = "closed";
      }, 1000);
    }
  }
  private static handleKeypad(context: InteractionContext) {
    const { interactable, room, payload } = context;
    
    // Keypads don't change state directly, they just emit the submitted payload to the puzzle manager
    room.puzzleManager.handleEvent({
      type: "interaction.keypad_submit",
      objectId: interactable.id,
      playerId: context.player.playerId,
      payload: payload
    });
  }
  private static handleToggle(context: InteractionContext) {
    const { interactable } = context;
    if (interactable.state === "idle" || interactable.state === "off") {
      interactable.state = "on";
    } else {
      interactable.state = "off";
    }
  }

  private static handleButton(context: InteractionContext) {
    const { interactable } = context;
    if (interactable.state === "idle") {
      interactable.state = "pressed";
      setTimeout(() => {
        interactable.state = "idle";
      }, 500);
    }
  }

  private static handleOneTime(context: InteractionContext) {
    const { interactable } = context;
    if (interactable.state === "idle") {
      interactable.state = "consumed";
      interactable.enabled = false;
    }
  }
}

export enum Ability {
  SEE_HIDDEN_CLUE = "SEE_HIDDEN_CLUE",
  DECODE_SYMBOL = "DECODE_SYMBOL",
  OPERATE_MACHINE = "OPERATE_MACHINE",
  SEE_HIDDEN_ROUTE = "SEE_HIDDEN_ROUTE",
  PLACE_NAVIGATION_MARKER = "PLACE_NAVIGATION_MARKER",
  INSPECT_SPECIAL_OBJECT = "INSPECT_SPECIAL_OBJECT",
  READ_ENCRYPTED_PANEL = "READ_ENCRYPTED_PANEL",
  REPAIR_SYSTEM = "REPAIR_SYSTEM"
}

export enum RoleType {
  OBSERVER = "OBSERVER",
  DECODER = "DECODER",
  ENGINEER = "ENGINEER",
  NAVIGATOR = "NAVIGATOR",
  UNASSIGNED = "UNASSIGNED"
}

export interface RoleDefinition {
  id: RoleType;
  name: string;
  description: string;
  abilities: Ability[];
}

export const ROLE_DEFINITIONS: Record<RoleType, RoleDefinition> = {
  [RoleType.OBSERVER]: {
    id: RoleType.OBSERVER,
    name: "OBSERVER",
    description: "You can see hidden clues and inspect special environmental details that others cannot.",
    abilities: [Ability.SEE_HIDDEN_CLUE, Ability.INSPECT_SPECIAL_OBJECT]
  },
  [RoleType.DECODER]: {
    id: RoleType.DECODER,
    name: "DECODER",
    description: "You can interpret symbols, decode patterns, and read specialized translation panels.",
    abilities: [Ability.DECODE_SYMBOL, Ability.READ_ENCRYPTED_PANEL]
  },
  [RoleType.ENGINEER]: {
    id: RoleType.ENGINEER,
    name: "ENGINEER",
    description: "You can operate restricted machinery, activate power systems, and interact with terminals.",
    abilities: [Ability.OPERATE_MACHINE, Ability.REPAIR_SYSTEM]
  },
  [RoleType.NAVIGATOR]: {
    id: RoleType.NAVIGATOR,
    name: "NAVIGATOR",
    description: "You can identify hidden routes, see navigation info, and locate important objectives.",
    abilities: [Ability.SEE_HIDDEN_ROUTE, Ability.PLACE_NAVIGATION_MARKER]
  },
  [RoleType.UNASSIGNED]: {
    id: RoleType.UNASSIGNED,
    name: "UNASSIGNED",
    description: "Awaiting role assignment.",
    abilities: []
  }
};

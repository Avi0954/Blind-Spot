import { Player, RoleType } from "@blind-spot/shared";

export class RoleManager {
  /**
   * Assigns roles deterministically based on player count.
   * 2 players: Observer, Engineer
   * 3 players: Observer, Decoder, Engineer
   * 4 players: Observer, Decoder, Engineer, Navigator
   * 5+ players: Repeat the roles
   */
  static assignRoles(players: Player[]) {
    if (players.length === 0) return;

    let rolesToAssign: RoleType[] = [];

    if (players.length === 1) {
      rolesToAssign = [RoleType.ENGINEER]; // Give them the most active role
    } else if (players.length === 2) {
      rolesToAssign = [RoleType.OBSERVER, RoleType.ENGINEER];
    } else if (players.length === 3) {
      rolesToAssign = [RoleType.OBSERVER, RoleType.DECODER, RoleType.ENGINEER];
    } else {
      // 4 or more players
      rolesToAssign = [
        RoleType.OBSERVER,
        RoleType.DECODER,
        RoleType.ENGINEER,
        RoleType.NAVIGATOR
      ];
    }

    players.forEach((player, index) => {
      player.role = rolesToAssign[index % rolesToAssign.length];
      console.log(`[RoleManager] Assigned ${player.role} to ${player.name} (${player.playerId})`);
    });
  }
}

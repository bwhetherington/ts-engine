import { Player } from 'core/player/player';
import { PlayerManager } from 'core/player/manager';

const manager = new PlayerManager();
export { Player, manager as PlayerManager };

export interface Account {
  username: string;
  xp: number;
  className: string;
  permissionLevel: number;
}

export interface PlayerLeaveEvent {
  player: Player;
}

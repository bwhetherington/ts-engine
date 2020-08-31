import { Player } from 'core/player/player';
import { PlayerManager } from 'core/player/manager';

const manager = new PlayerManager();
export { Player, manager as PlayerManager };

export interface PlayerLeaveEvent {
  player: Player;
}

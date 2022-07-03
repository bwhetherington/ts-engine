import {Player} from '@/core/player/player';
import {PlayerManager} from '@/core/player/manager';
import {makeEventType} from '../event';

const manager = new PlayerManager();
export {Player, manager as PlayerManager};

export interface Account {
  username: string;
  xp: number;
  className: string;
  permissionLevel: number;
}

export interface PlayerJoinEvent {
  player: Player;
}
export const PlayerJoinEvent =
  makeEventType<PlayerJoinEvent>('PlayerJoinEvent');

export interface PlayerLeaveEvent {
  player: Player;
}
export const PlayerLeaveEvent =
  makeEventType<PlayerLeaveEvent>('PlayerLeaveEvent');

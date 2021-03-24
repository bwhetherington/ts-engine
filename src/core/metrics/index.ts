import {UUID} from 'core/uuid';

export interface MetricsEvent {
  tps: number;
  entities: number;
  uuids: number;
  listeners: number;
  connections: number;
  timeElapsed: number;
  pings: Record<UUID, number>;
}

export interface PingEvent {
  playerID: UUID;
  ping: number;
}

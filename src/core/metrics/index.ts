import {UUID} from '@/core/uuid';
import {makeEventType} from '../event';

export interface MetricsEvent {
  tps: number;
  entities: number;
  uuids: number;
  listeners: number;
  connections: number;
  timeElapsed: number;
  pings: Record<UUID, number>;
}
export const MetricsEvent = makeEventType<MetricsEvent>('MetricsEvent');

export interface PingEvent {
  playerID: UUID;
  ping: number;
}
export const PingEvent = makeEventType<PingEvent>('PingEvent');

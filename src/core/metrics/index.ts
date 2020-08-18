export interface MetricsEvent {
  tps: number;
  entities: number;
  listeners: number;
  connections: number;
  timeElapsed: number;
}

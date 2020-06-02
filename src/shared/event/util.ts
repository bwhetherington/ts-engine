export interface GameEvent {
  type: string;
  data: EventData;
}

export interface EventData {
  [key: string]: any;
}

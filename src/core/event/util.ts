import { Socket } from 'core/net';

export type Handler<T extends EventData> = (arg: Event<T>, id: string) => void;

export type GameHandler = Handler<any>;

export interface Event<T extends EventData> {
  socket?: Socket;
  type: string;
  data: T;
}

export type GameEvent = Event<any>;

export function isEvent(x: any): x is GameEvent {
  return (
    typeof x === 'object' &&
    x.hasOwnProperty('type') &&
    typeof x.type === 'string' &&
    x.hasOwnProperty('data') &&
    typeof x.data === 'object'
  );
}

export interface EventData {
  [key: string]: any;
}

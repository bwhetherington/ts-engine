import {Socket} from '@/core/net';
import {Player} from '@/core/player';
import {UUID} from '@/core/uuid';

type HandlerFunction<T, U> = (arg: Event<T>, id: UUID) => U;

export type Handler<T extends EventData> = HandlerFunction<
  T,
  void | Promise<void>
>;

export type GameHandler = Handler<any>;

export interface Event<T extends EventData> {
  socket?: Socket;
  type: string;
  data: T;
}

export interface PlayerEvent<T extends EventData> {
  player: Player;
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

export enum Priority {
  Highest = 0,
  High = 1,
  Normal = 2,
  Low = 3,
  Lowest = 4,
}

export function* priorities(): Iterable<Priority> {
  for (let i = Priority.Highest; i <= Priority.Lowest; i++) {
    yield i;
  }
}

export interface EventData {
  [key: string]: any;
}

export interface BatchEvent {
  events: GameEvent[];
}

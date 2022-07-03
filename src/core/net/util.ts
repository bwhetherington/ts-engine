import {LogManager} from '@/core/log';
import {EventManager, GameEvent, makeEventType} from '@/core/event';
import {Data} from '@/core/serialize';
import {UUID} from '@/core/uuid';

const log = LogManager.forFile(__filename);

export interface Message {
  [key: string]: any;
}

export type Socket = number;

export interface ConnectEvent {
  socket: Socket;
}
export const ConnectEvent = makeEventType<ConnectEvent>('ConnectEvent');

export interface DisconnectEvent {
  socket: Socket;
}
export const DisconnectEvent =
  makeEventType<DisconnectEvent>('DisconnectEvent');

export interface NetworkMessageEvent {
  socket: Socket;
  message: Message;
}
export const NetworkMessageEvent = makeEventType<NetworkMessageEvent>(
  'NetworkMessageEvent'
);

export interface SyncEvent {
  worldData: Data;
  playerData: Data;
}
export const SyncEvent = makeEventType<SyncEvent>('SyncEvent');

export interface InitialSyncEvent {
  socket: Socket;
  sync: SyncEvent;
}
export const InitialSyncEvent =
  makeEventType<InitialSyncEvent>('InitialSyncEvent');

export interface PlayerInitializedEvent {}
export const PlayerInitializedEvent = makeEventType<PlayerInitializedEvent>(
  'PlayerInitializedEvent'
);

export interface PingEvent {
  id: UUID;
}
export const PingEvent = makeEventType<PingEvent>('PingEvent');

export abstract class Node {
  public abstract send(msg: Message, socket: Socket): void;

  public abstract disconnect(socket: Socket): void;

  public onMessage(message: Message, socket: Socket) {
    EventManager.emitEvent(NetworkMessageEvent, {
      socket,
      message,
    });

    // If the message is also a game event, mirror it
    if (typeof message.type === 'string' && typeof message.data === 'object') {
      EventManager.emit({
        type: message.type,
        data: message.data,
        socket,
      });
    }
  }

  public onConnect(socket: Socket) {
    EventManager.emitEvent(ConnectEvent, {socket});
  }

  public onDisconnect(socket: Socket) {
    EventManager.emitEvent(DisconnectEvent, {socket});
  }

  public isClient(): boolean {
    return false;
  }

  public isServer(): boolean {
    return !this.isClient();
  }

  public stop() {}
}

export class DefaultNode extends Node {
  public override disconnect(_socket: Socket) {
    log.warn('default network node in use');
  }

  public override send(_msg: Message, _socket: Socket) {
    log.warn('default network node in use');
  }

  public override onMessage(_msg: Message, _socket: Socket) {
    log.warn('default network node in use');
  }

  public override onConnect(_socket: Socket) {
    log.warn('default network node in use');
  }

  public override onDisconnect(_socket: Socket) {
    log.warn('default network node in use');
  }
}

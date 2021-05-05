import {LogManager} from 'core/log';
import {EventManager, GameEvent} from 'core/event';
import {Data} from 'core/serialize';
import {UUID} from 'core/uuid';

const log = LogManager.forFile(__filename);

export interface Message {
  [key: string]: any;
}

export type Socket = number;

export abstract class Node {
  public abstract send(msg: Message, socket: Socket): void;

  public abstract disconnect(socket: Socket): void;

  public onMessage(message: Message, socket: Socket) {
    const event = {
      type: 'NetworkMessageEvent',
      data: <NetworkMessageEvent>{
        socket,
        message,
      },
    };
    EventManager.emit(event);

    // If the message is also a game event, mirror it
    if (typeof message.type === 'string' && typeof message.data === 'object') {
      const gameEvent: GameEvent = {
        type: message.type,
        data: message.data,
        socket,
      };
      EventManager.emit(gameEvent);
    }
  }

  public onConnect(socket: Socket) {
    const event = {
      type: 'ConnectEvent',
      data: <ConnectEvent>{
        socket,
      },
    };
    EventManager.emit(event);
  }

  public onDisconnect(socket: Socket) {
    const event = {
      type: 'DisconnectEvent',
      data: <DisconnectEvent>{
        socket,
      },
    };
    EventManager.emit(event);
  }

  public isClient(): boolean {
    return false;
  }

  public isServer(): boolean {
    return !this.isClient();
  }
}

export class DefaultNode extends Node {
  public disconnect(socket: Socket): void {
    log.warn('default network node in use');
  }

  public send(msg: Message, socket: Socket): void {
    log.warn('default network node in use');
  }

  public onMessage(msg: Message, socket: Socket): void {
    log.warn('default network node in use');
  }

  public onConnect(socket: Socket): void {
    log.warn('default network node in use');
  }

  public onDisconnect(socket: Socket): void {
    log.warn('default network node in use');
  }
}

export interface ConnectEvent {
  socket: Socket;
}

export interface DisconnectEvent {
  socket: Socket;
}

export interface NetworkMessageEvent {
  socket: Socket;
  message: Message;
}

export interface SyncEvent {
  worldData: Data;
  playerData: Data;
}

export interface InitialSyncEvent {
  socket: Socket;
  sync: SyncEvent;
}

export interface PlayerInitializedEvent {}

export interface PingEvent {
  id: UUID;
}

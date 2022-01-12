import {LogManager} from '@/core/log';
import {EventManager, GameEvent} from '@/core/event';
import {Data} from '@/core/serialize';
import {UUID} from '@/core/uuid';

const log = LogManager.forFile(__filename);

export interface Message {
  [key: string]: any;
}

export type Socket = number;

export abstract class Node {
  public abstract send(msg: Message, socket: Socket): void;

  public abstract disconnect(socket: Socket): void;

  public onMessage(message: Message, socket: Socket) {
    EventManager.emit<NetworkMessageEvent>({
      type: 'NetworkMessageEvent',
      data: {
        socket,
        message,
      },
    });

    // If the message is also a game event, mirror it
    if (typeof message.type === 'string' && typeof message.data === 'object') {
      EventManager.emit<GameEvent>({
        type: message.type,
        data: message.data,
        socket,
      });
    }
  }

  public onConnect(socket: Socket) {
    EventManager.emit<ConnectEvent>({
      type: 'ConnectEvent',
      data: {
        socket,
      },
    });
  }

  public onDisconnect(socket: Socket) {
    EventManager.emit<DisconnectEvent>({
      type: 'DisconnectEvent',
      data: {
        socket,
      },
    });
  }

  public isClient(): boolean {
    return false;
  }

  public isServer(): boolean {
    return !this.isClient();
  }
}

export class DefaultNode extends Node {
  public override disconnect(socket: Socket) {
    log.warn('default network node in use');
  }

  public override send(msg: Message, socket: Socket) {
    log.warn('default network node in use');
  }

  public override onMessage(msg: Message, socket: Socket) {
    log.warn('default network node in use');
  }

  public override onConnect(socket: Socket) {
    log.warn('default network node in use');
  }

  public override onDisconnect(socket: Socket) {
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

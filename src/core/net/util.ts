import { LM } from 'core/log';
import { EM, GameEvent } from 'core/event';

export interface Message {
  [key: string]: any;
}

export type Socket = number;

export abstract class Node {
  public abstract send(msg: Message, socket: Socket): void;
  public onMessage(message: Message, socket: Socket) {
    const event = {
      type: 'NetworkMessageEvent',
      data: {
        socket,
        message,
      },
    };
    EM.emit(event);

    // If the message is also a game event, mirror it
    if (typeof message.type === 'string' && typeof message.data === 'object') {
      const gameEvent: GameEvent = {
        type: message.type,
        data: message.data,
        socket,
      };
      EM.emit(gameEvent);
    }
  }

  public onConnect(socket: Socket) {
    const event = {
      type: 'ConnectEvent',
      data: {
        socket,
      },
    };
    EM.emit(event);
  }

  public onDisconnect(socket: Socket) {
    const event = {
      type: 'DisconnectEvent',
      data: {
        socket,
      },
    };
    EM.emit(event);
  }
}

export class DefaultNode implements Node {
  public send(msg: Message, socket: Socket) {
    LM.warn('default network node in use');
  }

  public onMessage(msg: Message, socket: Socket) {
    LM.warn('default network node in use');
  }

  public onConnect(socket: Socket) {
    LM.warn('default network node in use');
  }

  public onDisconnect(socket: Socket) {
    LM.warn('default network node in use');
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

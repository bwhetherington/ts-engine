import { Node, Message, Socket, DisconnectEvent } from 'core/net';
import { LogManager } from 'core/log';
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator';
import { SetNameEvent } from 'core/chat';
import { EventManager } from 'core/event';
import { InitialSyncEvent } from 'core/net/util';
import { PlayerManager } from 'core/player';
import { WorldManager } from 'core/entity';

const log = LogManager.forFile(__filename);

function generateName(): string {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    length: 2,
    separator: '-',
    style: 'capital',
  });
}

function getProtocol(): string {
  return location.protocol === 'https:' ? 'wss:' : 'ws:';
}

export class Client extends Node {
  private sendBuffer: Message[] = [];
  private socket: WebSocket;
  private isConnected: boolean = false;
  private name: string = '';

  private startTime: number = 0;
  private pingResolver?: (x: number) => void;

  constructor(addr?: string) {
    super();

    this.name = generateName();

    let connect;
    if (addr) {
      connect = addr;
    } else {
      connect = `${getProtocol()}//${location.host}`;
    }
    this.socket = new WebSocket(connect);
    this.initializeSocket(this.socket);

    EventManager.addListener<InitialSyncEvent>('InitialSyncEvent', (event) => {
      const { socket, sync } = event.data;
      PlayerManager.setActivePlayer(socket);
      const { worldData, playerData } = sync;
      WorldManager.deserialize(worldData);
      PlayerManager.deserialize(playerData);
    });
  }

  private getPing(): Promise<number> {
    this.startTime = EventManager.timeElapsed;
    return new Promise((resolve) => {
      this.pingResolver = resolve;
    });
  }

  private initializeSocket(socket: WebSocket) {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data, -1);

      // Immediately respond to pings
      if (data.type === 'PingEvent') {
        this.send(data);
      }
    };
    socket.onopen = () => {
      this.onConnect(-1);
    };
    socket.onclose = () => {
      this.onDisconnect(-1);
    };
  }

  public disconnect(_: Socket): void {
    this.socket.close();
  }

  public send(message: Message, socket: Socket = -1) {
    if (socket === -1) {
      if (this.isConnected) {
        this.socket.send(JSON.stringify(message));
      } else {
        this.sendBuffer.push(message);
      }
    } else {
      log.error('only socket -1 exists on clients');
    }
  }

  public onConnect(socket: Socket) {
    this.isConnected = true;
    this.send({
      type: 'SetNameEvent',
      data: <SetNameEvent>{
        name: this.name,
      },
    });
    for (const message of this.sendBuffer) {
      this.send(message);
    }
    this.sendBuffer = [];
    super.onConnect(socket);
  }

  public onDisconnect(socket: Socket) {
    this.isConnected = false;
    log.debug('disconnected');
    super.onDisconnect(socket);
  }

  public isClient(): boolean {
    return true;
  }
}

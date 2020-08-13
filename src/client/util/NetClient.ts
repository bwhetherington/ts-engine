import { Node, Message, Socket, DisconnectEvent } from 'core/net';
import { LM as InternalLogger } from 'core/log';
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator';
import { SetNameEvent } from 'core/chat';
import { EM } from 'core/event';
import { InitialSyncEvent } from 'core/net/util';
import { PlayerManager } from 'core/player';
import { WM } from 'core/entity';

function generateName(): string {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    length: 2,
    separator: '-',
    style: 'capital',
  });
}

const LM = InternalLogger.forFile(__filename);

export class Client extends Node {
  private sendBuffer: Message[] = [];
  private socket: WebSocket;
  private isConnected: boolean = false;
  private name: string = '';

  constructor(addr?: string) {
    super();

    this.name = generateName();

    let connect;
    if (addr) {
      connect = addr;
    } else {
      connect = `ws://${location.host}`;
    }
    this.socket = new WebSocket(connect);
    this.initializeSocket(this.socket);

    EM.addListener<InitialSyncEvent>('InitialSyncEvent', (event) => {
      const { socket, sync } = event.data;
      PlayerManager.setActivePlayer(socket);
      const { worldData, playerData } = sync;
      WM.deserialize(worldData);
      PlayerManager.deserialize(playerData);
    });
  }

  private initializeSocket(socket: WebSocket) {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data, -1);
    };
    socket.onopen = () => {
      this.onConnect(-1);
    };
    socket.onclose = () => {
      this.onDisconnect(-1);
    };
  }

  public send(message: Message, socket: Socket = -1) {
    if (socket === -1) {
      if (this.isConnected) {
        this.socket.send(JSON.stringify(message));
      } else {
        this.sendBuffer.push(message);
      }
    } else {
      LM.error('only socket -1 exists on clients');
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
    LM.debug('disconnected');
    super.onDisconnect(socket);
  }

  public isClient(): boolean {
    return true;
  }
}

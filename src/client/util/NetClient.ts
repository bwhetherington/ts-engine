import { Node, Message, Socket } from 'core/net';
import { LM } from 'core/log';

export class Client extends Node {
  private sendBuffer: Message[] = [];
  private socket: WebSocket;
  private isConnected: boolean = false;

  constructor(addr?: string) {
    super();
    let connect;
    if (addr) {
      connect = addr;
    } else {
      connect = `ws://${location.host}`;
    }
    this.socket = new WebSocket(connect);
    this.initializeSocket(this.socket);
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
}

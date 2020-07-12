import {
  server as WebsocketServer,
  request as Request,
  connection as Connection,
} from 'websocket';
import * as http from 'http';

import { Node, Message, Socket } from 'core/net';
import { LM } from 'core/log';
import { EM, Event, StepEvent } from 'core/event';
import { TM } from 'server/util';
import { WM } from 'core/entity';
import { SyncEvent } from 'core/entity/WorldManager';

interface Connections {
  [key: number]: Connection;
}

export class Server extends Node {
  private httpServer?: http.Server;
  private wsServer?: WebsocketServer;
  private connections: Connections;
  private freedSockets: Socket[];
  private socketCount: number = 0;
  private names: { [key: number]: string } = {};

  constructor() {
    super();
    this.connections = {};
    this.freedSockets = [];

    EM.addListener('SetName', (event: Event<{ name: string }>) => {
      const { socket, data } = event;
      if (socket) {
        this.names[socket] = data.name;
      }
    });

    EM.addListener('StepEvent', (_: Event<StepEvent>) => {
      const event = {
        type: 'SyncEvent',
        data: <SyncEvent>{
          data: WM.serialize(),
        },
      };
      this.send(event);
    });
  }

  private disconnect(index: Socket) {
    const socket = this.connections[index];
    if (socket !== undefined) {
      socket.close();
      delete this.connections[index];
      this.freedSockets.push(index);
      LM.debug(`disconnected socket ${index}`);
      this.onDisconnect(index);
    } else {
      LM.warn(`attempt to disconnect inactive socket ${index}`);
    }

    // Sleep the server clock
    if (Object.keys(this.connections).length === 0) {
      TM.sleep();
    }
  }

  private initializeConnection(connection: Connection, index: Socket) {
    connection.on('message', (data) => {
      const { type, utf8Data } = data;
      if (utf8Data && type === 'utf8') {
        const parsed: Message = JSON.parse(utf8Data);
        this.onMessage(parsed, index);
      }
    });
    connection.on('close', () => {
      this.disconnect(index);
    });
  }

  private accept(request: Request) {
    const connection = request.accept();
    const index = this.allocateSocket();
    this.connections[index] = connection;
    LM.debug(`accepted connection on socket ${index}`);
    this.initializeConnection(connection, index);
    this.onConnect(index);
  }

  private allocateSocket(): Socket {
    // Check if we have a freed socket to use
    const socket = this.freedSockets.pop();
    if (socket !== undefined) {
      // We can use a freed socket
      return socket;
    } else {
      const index = this.socketCount;
      this.socketCount += 1;
      return index;
    }
  }

  public initialize(httpServer: http.Server) {
    this.httpServer = httpServer;
    this.wsServer = new WebsocketServer({ httpServer });
    this.wsServer.on('request', (req) => {
      this.accept(req);
    });
    this.wsServer.on('close', (connection) => {});
  }

  private sendRaw(data: string, socket: Socket) {
    const connection = this.connections[socket];
    connection?.sendUTF(data);
  }

  public send(message: Message, socket: Socket = -1) {
    const data = JSON.stringify(message);
    if (socket === -1) {
      // Send to all sockets
      for (const index in this.connections) {
        this.sendRaw(data, parseInt(index));
      }
    } else {
      // Send to just one socket
      const connection = this.connections[socket];
      connection?.sendUTF(JSON.stringify(message));
    }
  }

  public start(port: number = 8080) {
    this.httpServer?.listen(port);
    LM.info(`listening on port ${port}`);
  }

  public onConnect(socket: Socket): void {
    super.onConnect(socket);

    // Try to wake the server clock
    TM.wake();
  }
}

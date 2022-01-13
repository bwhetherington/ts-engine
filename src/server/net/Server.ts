import {
  server as WebsocketServer,
  request as Request,
  connection as Connection,
} from 'websocket';
import * as http from 'http';

import {Node, Message, Socket} from '@/core/net';
import {LogManager} from '@/core/log';
import {PlayerManager, Player} from '@/core/player';
import {EventManager, Event, StepEvent, Priority} from '@/core/event';
import {TimerManager, now} from '@/server/util';
import {WorldManager} from '@/core/entity';
import {InitialSyncEvent, PlayerInitializedEvent} from '@/core/net/util';
import process from 'process';
import {isUUID, UUID, UUIDManager} from '@/core/uuid';
import {MetricsManager} from '@/server/metrics';
import {Data, SerializeManager} from '@/core/serialize';
import {Iterator} from '@/core/iterator';

const log = LogManager.forFile(__filename);

type Connections = Record<string, Connection>;

interface PingEntry {
  startTime: number;
  resolver(time: number): void;
}

export class Server extends Node {
  private httpServer?: http.Server;
  private wsServer?: WebsocketServer;
  private connections: Connections;
  private freedSockets: Socket[];
  private socketCount: number = 0;

  private pingResolvers: Record<UUID, PingEntry> = {};

  constructor() {
    super();
    this.connections = {};
    this.freedSockets = [];

    let timeElapsed = 0;
    EventManager.addListener<StepEvent>('StepEvent', (event) => {
      timeElapsed += event.data.dt;
      if (timeElapsed >= 1) {
        timeElapsed %= 1;
        this.checkPings();
      }
    });
  }

  public async checkPings() {
    for (const player of PlayerManager.getPlayers()) {
      this.getPing(player).then((ping) => {
        MetricsManager.recordPing(player, ping);
      });
    }
  }

  private getPing(player: Player): Promise<number> {
    return new Promise((resolve) => {
      const id = UUIDManager.generate();
      const startTime = now();
      this.send(
        {
          type: 'PingEvent',
          data: {id},
        },
        player.socket
      );
      this.pingResolvers[id] = {
        startTime,
        resolver: resolve,
      };
    });
  }

  public disconnect(index: Socket) {
    const socket = this.connections[index];
    if (socket !== undefined) {
      socket.close();
      delete this.connections[index];
      this.freedSockets.push(index);
      log.debug(`disconnected socket ${index}`);
      this.onDisconnect(index);
    } else {
      log.warn(`attempt to disconnect inactive socket ${index}`);
    }
  }

  private initializeConnection(connection: Connection, index: Socket) {
    connection.on('message', (data: Message) => {
      const {type, utf8Data} = data;
      if (utf8Data && type === 'utf8') {
        this.receiveRaw(utf8Data, index);
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
    log.debug(`accepted connection on socket ${index}`);
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
    this.wsServer = new WebsocketServer({httpServer});
    this.wsServer.on('request', (req) => {
      this.accept(req);
    });
    this.wsServer.on('close', () => {});

    EventManager.streamEvents<PlayerInitializedEvent>(
      'PlayerInitializedEvent',
      Priority.Normal,
      true
    )
      .filterMap(({socket}) => (socket !== undefined ? socket : undefined))
      .forEach((socket) => this.initialSync(socket));
  }

  protected sendRaw(data: string, socket: Socket) {
    const connection = this.connections[socket];
    connection?.sendUTF(data);
  }

  public send(message: Message, socket: Socket = -1) {
    const data = SerializeManager.serialize(message);
    if (socket === -1) {
      // Send to all sockets
      Iterator.keys(this.connections)
        .filterMap((key) => {
          const index = parseInt(key);
          if (!Number.isNaN(index)) {
            return index;
          }
        })
        .forEach((index) => this.sendRaw(data, index));
    } else {
      // Send to just one socket
      const connection = this.connections[socket];
      connection?.sendUTF(data);
    }
  }

  public start(port: number = 8080) {
    try {
      this.httpServer?.listen(port);
    } catch (ex) {
      log.error(`port ${port} is already in use`);
      process.abort();
    }
    log.info(`listening on port ${port}`);
  }

  public onConnect(socket: Socket) {
    super.onConnect(socket);

    // Initialize player
    const player = new Player();
    player.socket = socket;
    PlayerManager.add(player);

    // Try to wake the server clock
    TimerManager.wake();
  }

  public initialSync(socket: Socket) {
    const event: Event<InitialSyncEvent> = {
      type: 'InitialSyncEvent',
      data: {
        socket,
        sync: {
          worldData: WorldManager.serialize(),
          playerData: PlayerManager.serialize(),
        },
      },
    };
    this.send(event, socket);
  }

  public onDisconnect(socket: Socket) {
    super.onDisconnect(socket);

    const player = PlayerManager.getSocket(socket);
    if (player) {
      PlayerManager.remove(player);
      MetricsManager.removePlayer(player);
    }

    // Sleep the server clock
    if (Object.keys(this.connections).length === 0) {
      TimerManager.sleep();
    }
  }

  public isClient(): boolean {
    return false;
  }

  protected receiveRaw(data: string, socket: Socket) {
    const parsed: Data = SerializeManager.deserialize(data);
    this.onMessage(parsed, socket);
  }

  public onMessage(message: Message, socket: Socket) {
    if (message.type === 'PingEvent' && isUUID(message.data?.id)) {
      const id = message.data.id as UUID;
      const entry = this.pingResolvers[id];
      if (entry) {
        // ESLint erroneously thinks this is referencing an unbound method
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const {startTime, resolver} = entry;
        const endTime = now();
        resolver(endTime - startTime);
        delete this.pingResolvers[id];
        UUIDManager.free(id);
      }
    }

    super.onMessage(message, socket);
  }
}

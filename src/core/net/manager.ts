import {Message, Socket, Node, DefaultNode} from 'core/net';
import {LogManager} from 'core/log';
import {HTTPClient} from 'core/net/http';
import {Event, EventData} from 'core/event';

const log = LogManager.forFile(__filename);

export class NetworkManager {
  private node: Node = new DefaultNode();
  public http?: HTTPClient;

  public get dbServer(): string {
    return process.env.GAME_DB ?? '';
  }

  public initialize(node: Node, http?: HTTPClient) {
    this.node = node;
    this.http = http;
    log.debug('NetworkManager initialized');
  }

  public disconnect(socket: Socket) {
    this.node.disconnect(socket);
  }

  public send(msg: Message, socket: Socket = -1) {
    this.node.send(msg, socket);
  }

  public sendEvent<E extends EventData>(event: Event<E>, socket: Socket = -1) {
    this.node.send(event, socket);
  }

  public isClient(): boolean {
    return this.node.isClient();
  }

  public isServer(): boolean {
    return this.node.isServer();
  }
}

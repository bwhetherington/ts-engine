import { Message, Socket, Node, DefaultNode } from 'core/net';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

export class NetworkManager {
  private node: Node = new DefaultNode();

  public initialize(node: Node) {
    this.node = node;
    log.debug('NetworkManager initialized');
  }

  public disconnect(socket: Socket): void {
    this.node.disconnect(socket);
  }

  public send(msg: Message, socket: Socket = -1) {
    this.node.send(msg, socket);
  }

  public isClient(): boolean {
    return this.node.isClient();
  }

  public isServer(): boolean {
    return this.node.isServer();
  }
}

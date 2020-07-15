import { Message, Socket, Node, DefaultNode } from 'core/net';
import { LM as InternalLogger } from 'core/log';

const LM = InternalLogger.forFile(__filename);

export class NetworkManager {
  private node: Node = new DefaultNode();

  public initialize(node: Node) {
    this.node = node;
    LM.debug('NetworkManager initialized');
  }

  public send(msg: Message, socket: Socket = -1) {
    this.node.send(msg, socket);
  }
}

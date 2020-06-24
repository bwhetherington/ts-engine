import {
  Message,
  Socket,
  Node,
  DefaultNode,
  NetworkMessageEvent,
  ConnectEvent,
  DisconnectEvent,
} from "./util";
import LM from "../util/LogManager";
import EM from "../event/EventManager";

class NetworkManager {
  private node: Node = new DefaultNode();

  public initialize(node: Node) {
    this.node = node;
    LM.debug("NetworkManager initialized");
  }

  public send(msg: Message, socket: Socket = -1) {
    this.node.send(msg, socket);
  }
}

const NM = new NetworkManager();
export default NM;

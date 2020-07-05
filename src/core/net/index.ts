import { NetworkManager } from 'core/net/NetworkManager';
import {
  Message,
  Socket,
  Node,
  DefaultNode,
  ConnectEvent,
  DisconnectEvent,
  NetworkMessageEvent,
} from 'core/net/util';

export const NM = new NetworkManager();
export {
  Message,
  Socket,
  Node,
  DefaultNode,
  ConnectEvent,
  DisconnectEvent,
  NetworkMessageEvent,
};

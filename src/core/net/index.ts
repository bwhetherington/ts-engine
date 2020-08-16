import { NetworkManager } from 'core/net/manager';
export {
  Message,
  Socket,
  Node,
  DefaultNode,
  ConnectEvent,
  DisconnectEvent,
  NetworkMessageEvent,
  SyncEvent,
} from 'core/net/util';
export { HTTPClient, HTTPResponse } from 'core/net/http';

const NM = new NetworkManager();
export { NM as NetworkManager };

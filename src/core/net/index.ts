import { NetworkManager } from 'core/net/manager';
import {
  Message,
  Socket,
  Node,
  DefaultNode,
  ConnectEvent,
  DisconnectEvent,
  NetworkMessageEvent,
  SyncEvent,
} from 'core/net/util';
import { HTTPClient, HTTPResponse } from 'core/net/http';

const NM = new NetworkManager();
export {
  Message,
  Socket,
  Node,
  DefaultNode,
  ConnectEvent,
  DisconnectEvent,
  NetworkMessageEvent,
  HTTPClient,
  HTTPResponse,
  SyncEvent,
  NM as NetworkManager,
};

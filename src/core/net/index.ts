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
import { HTTPClient, HTTPResponse } from 'core/net/http';

export const NM = new NetworkManager();
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
};

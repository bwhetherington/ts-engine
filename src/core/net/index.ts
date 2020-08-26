import { NetworkManager } from 'core/net/manager';
export * from 'core/net/util';
export { HTTPClient, HTTPResponse } from 'core/net/http';

const NM = new NetworkManager();
export { NM as NetworkManager };

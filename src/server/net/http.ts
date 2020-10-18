import { LogManager } from 'core/log';
import { HTTPClient, HTTPResponse, NetworkManager } from 'core/net';
import { BasicAuth } from 'core/net/http';
import { Data } from 'core/serialize';
import fetch from 'node-fetch';

const log = LogManager.forFile(__filename);

function addBasicAuth(auth: BasicAuth, headers: Data): void {
  const field = auth.username + ':' + auth.password;
  const buf = Buffer.from(field, 'utf-8');
  const base64 = buf.toString('base64');
  const line = 'Basic ' + base64;
  headers.Authorization = line;
}

function formatURI(uri: string): string {
  if (uri.startsWith('/')) {
    const prefix = NetworkManager.dbServer;
    return prefix + uri;
  } else {
    return uri;
  }
}

export class ServerHTTPClient implements HTTPClient {
  async get(uri: string, auth?: BasicAuth): Promise<HTTPResponse> {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (auth) {
      addBasicAuth(auth, headers);
    }
    const response = await fetch(formatURI(uri), {
      method: 'GET',
      headers,
    });

    log.info(`GET ${uri} ${response.status}`);
    const code = response.status;
    const body = await response.json();
    return { code, data: body };
  }

  async post(
    uri: string,
    data: object,
    auth?: BasicAuth
  ): Promise<HTTPResponse> {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (auth) {
      addBasicAuth(auth, headers);
    }
    const response = await fetch(formatURI(uri), {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });

    log.info(`POST ${uri} ${response.status}`);
    const code = response.status;
    const body = await response.json();
    return { code, data: body };
  }
}

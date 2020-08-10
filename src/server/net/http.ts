import { HTTPClient, HTTPResponse } from 'core/net';
import fetch from 'node-fetch';

export class ServerHTTPClient implements HTTPClient {
  async get(uri: string): Promise<HTTPResponse> {
    const response = await fetch(uri, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const code = response.status;
      const data = await response.json();
      return { code, data };
    } else {
      throw new Error('HTTP error');
    }
  }

  async post(uri: string, data: object): Promise<HTTPResponse> {
    const response = await fetch(uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const code = response.status;
      const data = await response.json();
      return { code, data };
    } else {
      throw new Error('HTTP error');
    }
  }
}

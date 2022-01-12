import {Data} from '@/core/serialize';

export interface BasicAuth {
  username: string;
  password: string;
}

export interface HTTPResponse {
  code: number;
  data: Data;
}

export interface HTTPClient {
  get(uri: string, auth?: BasicAuth): Promise<HTTPResponse>;
  post(uri: string, body: object, auth?: BasicAuth): Promise<HTTPResponse>;
}

export function isOk(status: number): boolean {
  return 200 <= status && status < 300;
}

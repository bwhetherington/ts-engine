export interface HTTPResponse {
  code: number;
  data: object;
}

export interface HTTPClient {
  get(uri: string): Promise<HTTPResponse>;
  post(uri: string, body: object): Promise<HTTPResponse>;
}

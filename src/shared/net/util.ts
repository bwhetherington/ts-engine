export interface Message {
  [key: string]: any;
}

export type Socket = number;

export interface Node {
  send(msg: Message, socket: Socket): void;
  receive(msg: Message): void;
}

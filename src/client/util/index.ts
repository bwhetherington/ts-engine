import {Timer} from 'client/util/Timer';
import {Client} from 'client/util/NetClient';
import {HDCanvas} from 'client/util/canvas';
import {ClientLogger} from 'client/util/ClientLogger';
export * from 'client/util/path';

export async function loadFile(path: string): Promise<Buffer> {
  const res = await fetch(path);
  const text = await res.text();
  return Buffer.from(text);
}

export {Timer, Client, HDCanvas, ClientLogger};

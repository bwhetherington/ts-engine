import {Buffer as JsBuffer} from 'buffer';

import {Iterator} from '@/core/iterator';
import {NetworkManager} from '@/core/net';
import {BufferData} from '@/core/util';

import {ClientLogger} from '@/client/util/ClientLogger';
import {Client} from '@/client/util/NetClient';
import {Timer} from '@/client/util/Timer';
import {HDCanvas} from '@/client/util/canvas';
import {join, stripPrefix} from '@/client/util/path';

export async function loadFile(path: string): Promise<BufferData> {
  const res = await fetch(join('assets', path));
  const text = await res.text();
  if (NetworkManager.isServer()) {
    return Buffer.from(text);
  } else {
    return JsBuffer.from(text);
  }
}

export async function loadDirectory(path: string): Promise<string[]> {
  if (path.includes('.')) {
    return [];
  }
  const res = await fetch(join('assets', path));
  const data = await res.json();
  const filePaths = Iterator.values(data)
    .map((file) => `${file}`)
    .filterMap((file) => stripPrefix(file, 'assets'))
    .toArray();
  return filePaths;
}

export {join, Timer, Client, HDCanvas, ClientLogger};

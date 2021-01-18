import {Timer} from 'client/util/Timer';
import {Client} from 'client/util/NetClient';
import {HDCanvas} from 'client/util/canvas';
import {ClientLogger} from 'client/util/ClientLogger';
import {join, stripPrefix} from 'client/util/path';
import {Iterator} from 'core/iterator';

export async function loadFile(path: string): Promise<Buffer> {
  const res = await fetch(join('assets', path));
  const text = await res.text();
  return Buffer.from(text);
}

export async function loadDirectory(path: string): Promise<string[]> {
  const res = await fetch(join('assets', path));
  const data = await res.json();
  const filePaths = Iterator.values(data)
    .map((file) => '' + file)
    .filterMap((file) => stripPrefix(file, 'assets'))
    .toArray();
  return filePaths;
}

export {join, Timer, Client, HDCanvas, ClientLogger};

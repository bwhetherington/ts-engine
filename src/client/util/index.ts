import {join, stripPrefix} from 'client/util/path';
import {Iterator} from 'core/iterator';

export * from 'client/util/canvas';
export * from 'client/util/ClientLogger';
export * from 'client/util/NetClient';
export * from 'client/util/path';
export * from 'client/util/Timer';

const BUFFER_CACHE: Record<string, Buffer> = {};

export async function loadFile(path: string): Promise<Buffer> {
  let buf = BUFFER_CACHE[path];
  if (buf === undefined) {
    const res = await fetch(join('assets', path));
    const text = await res.text();
    buf = Buffer.from(text);
    BUFFER_CACHE[path] = buf;
  }
  return buf;
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

import {join, stripPrefix} from 'client/util/path';
import {Iterator} from 'core/iterator';
import {Cache} from 'core/util';

export * from 'client/util/canvas';
export * from 'client/util/ClientLogger';
export * from 'client/util/NetClient';
export * from 'client/util/path';
export * from 'client/util/Timer';

const BUFFER_CACHE: Cache<Buffer> = new Cache(50);

export function loadFile(path: string): Promise<Buffer> {
  return BUFFER_CACHE.getOrInsertAsync(path, async () => {
    const res = await fetch(join('assets', path));
    const text = await res.text();
    return Buffer.from(text);
  });
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

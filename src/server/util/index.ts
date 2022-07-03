import {readFile, readdir} from 'fs/promises';
import path from 'path';

import {Iterator} from '@/core/iterator';
import {BufferData} from '@/core/util';

import {ServerLogger} from '@/server/util/ServerLogger';
import {Timer, now} from '@/server/util/Timer';
import {TimerManager} from '@/server/util/TimerManager';

export * from '@/server/util/world';

function transformPath(url: string): string {
  const transformed = path.join('static', 'assets', url);
  return transformed;
}

export function loadFile(url: string): Promise<BufferData> {
  const actualPath = transformPath(url);
  return readFile(actualPath);
}

export async function loadDirectory(url: string): Promise<string[]> {
  if (url.includes('.')) {
    return [];
  }
  const actualPath = transformPath(url);
  const files = await readdir(actualPath);
  const prefix = path.join('static', 'assets') + path.sep;
  return Iterator.array(files)
    .filterMap((file) => {
      const fullPath = path.join(actualPath, file);
      const index = fullPath.indexOf(prefix);

      if (index < 0) {
        return undefined;
      }

      const realIndex = index + prefix.length;
      return fullPath.substring(realIndex);
    })
    .toArray();
}

const TM = new TimerManager();
export {TM as TimerManager, now, Timer, ServerLogger};

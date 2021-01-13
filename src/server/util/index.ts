import path from 'path';
import {readFile, readdir} from 'fs/promises';
import {now, Timer} from 'server/util/Timer';
import {ServerLogger} from 'server/util/ServerLogger';
import {TimerManager} from 'server/util/TimerManager';
import { Iterator } from 'core/iterator';
export * from 'server/util/world';

function transformPath(url: string): string {
  const transformed = path.join('static', 'assets', url);
  return transformed;
}

export async function loadFile(url: string): Promise<Buffer> {
  const actualPath = transformPath(url);
  return await readFile(actualPath);
}

export async function loadDirectory(url: string): Promise<string[]> {
  const actualPath = transformPath(url);
  const files = await readdir(actualPath);
  const prefix = path.join('static', 'assets') + path.sep;
  return Iterator.array(files).filterMap((file) => {
    const fullPath = path.join(actualPath, file);
    const index = fullPath.indexOf(prefix);

    if (index < 0) {
      return undefined;
    }

    const realIndex = index + prefix.length;
    return fullPath.substring(realIndex);
  }).toArray();
}

const TM = new TimerManager();
export {TM as TimerManager, now, Timer, ServerLogger};

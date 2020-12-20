import path from 'path';
import {readFile} from 'fs/promises';
import {now, Timer} from 'server/util/Timer';
import {ServerLogger} from 'server/util/ServerLogger';
import {TimerManager} from 'server/util/TimerManager';
export * from 'server/util/world';

function transformPath(url: string): string {
  const transformed = path.join('static', url);
  return transformed;
}

export async function loadFile(url: string): Promise<Buffer> {
  return await readFile(transformPath(url));
}

const TM = new TimerManager();
export {TM as TimerManager, now, Timer, ServerLogger};

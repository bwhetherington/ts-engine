import * as path from 'path';

import {AssetManager} from '@/core/assets';
import {WorldManager} from '@/core/entity';

export async function loadWorldFile(file: string): Promise<void> {
  const obj = await AssetManager.loadJSON(file);
  WorldManager.loadLevel(obj);
}

export function loadWorld(worldName: string): Promise<void> {
  const fileName = path.join('worlds', `${worldName}.yml`);
  return loadWorldFile(fileName);
}

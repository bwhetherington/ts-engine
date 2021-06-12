import * as path from 'path';
import {WorldManager} from 'core/entity';
import {AssetManager} from 'core/assets';

export async function loadWorldFile(file: string): Promise<void> {
  const obj = await AssetManager.loadJSON(file);
  WorldManager.loadLevel(obj);
}

export function loadWorld(worldName: string): Promise<void> {
  const fileName = path.join('worlds', `${worldName}.json`);
  return loadWorldFile(fileName);
}

import * as path from 'path';
import { WorldManager } from 'core/entity';
import { readFile } from 'fs/promises';

export async function loadWorldFile(file: string): Promise<void> {
  const text = await readFile(file, 'utf-8');
  const obj = JSON.parse(text);
  WorldManager.loadLevel(obj);
}

export async function loadWorld(worldName: string): Promise<void> {
  const fileName = path.join('worlds', worldName + '.json');
  return await loadWorldFile(fileName);
}

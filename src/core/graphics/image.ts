import { EventManager } from 'core/event';
import { sleep } from 'core/util';

export type GameImage = HTMLImageElement;

export function loadImage(url: string, timeout = 5): Promise<GameImage> {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
    await EventManager.sleep(timeout);
    reject(new Error('image load timed out'));
  });
}

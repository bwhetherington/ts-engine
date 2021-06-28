import {EventManager} from 'core/event';
import {Font, Sprite} from 'core/graphics';
import {GameImage} from 'core/graphics/image';
import {LogManager} from 'core/log';
import {Data} from 'core/serialize';
import {Cache} from 'core/util';

const log = LogManager.forFile(__filename);

type AssetLoader = (path: string) => Promise<Buffer>;

type DirectoryLoader = (path: string) => Promise<string[]>;

export class AssetManager {
  private loader?: AssetLoader;
  private directoryLoader?: DirectoryLoader;
  private imageCache: Cache<GameImage> = new Cache(20);

  public initialize(
    loader: AssetLoader,
    directoryLoader: DirectoryLoader
  ): void {
    this.loader = loader;
    this.directoryLoader = directoryLoader;
  }

  public async loadDirectory(path: string): Promise<string[]> {
    if (this.directoryLoader) {
      const data = await this.directoryLoader(path);
      log.debug('load directory: ' + path);
      return data;
    } else {
      log.error('directory loader not specified');
      throw new Error('directory loader not specified');
    }
  }

  public async loadBuffer(path: string): Promise<Buffer> {
    if (this.loader) {
      const data = await this.loader(path);
      log.debug('load asset: ' + path);
      return data;
    } else {
      log.error('asset loader not specified');
      throw new Error('asset loader not specified');
    }
  }

  public async loadAllBuffers(paths: string[]): Promise<Buffer[]> {
    return Promise.all(paths.map((path) => this.loadBuffer(path)));
  }

  public async load(
    path: string,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<string> {
    const buf = await this.loadBuffer(path);
    return buf.toString(encoding);
  }

  public async loadAll(
    paths: string[],
    encoding: BufferEncoding = 'utf-8'
  ): Promise<string[]> {
    return Promise.all(paths.map((path) => this.load(path, encoding)));
  }

  public async loadJSON(
    path: string,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<Data> {
    try {
      const str = await this.load(path, encoding);
      const obj = JSON.parse(str);
      return obj;
    } catch (ex) {
      log.error('Error reading JSON asset: ' + path);
      throw ex;
    }
  }

  private async loadImageSrc(path: string): Promise<string> {
    try {
      const base64 = await this.load(path);
      return `data:image/png;base64, ${base64}`;
    } catch (ex) {
      log.error('Error reading base64: ' + path);
      throw ex;
    }
  }

  public loadImage(
    path: string,
    timeout: number = 5
  ): Promise<GameImage> {
    return this.imageCache.getOrInsertAsync(path, async () => {
      const src = await this.loadImageSrc(path);
      const img = new Image();
      this.imageCache.insert(path, img);
      const imagePromise = new Promise<GameImage>(async (resolve, reject) => {
        img.onload = () => {
          resolve(img);
        };
        img.src = src;
        await EventManager.sleep(timeout);
        reject(new Error('image load timed out'));
      });
      const image = await imagePromise;
      return image;
    });
  }

  public async loadSprite(path: string): Promise<Sprite> {
    const spriteData = await this.loadJSON(path);
    const sprite = new Sprite();
    sprite.deserialize(spriteData);
    return sprite;
  }

  public async loadFont(path: string): Promise<Font> {
    const fontData = await this.loadJSON(path);
    const font = new Font();
    font.deserialize(fontData);
    return font;
  }

  public async loadAllJSON(
    paths: string[],
    encoding: BufferEncoding = 'utf-8'
  ): Promise<Data[]> {
    return Promise.all(paths.map((path) => this.loadJSON(path, encoding)));
  }
}

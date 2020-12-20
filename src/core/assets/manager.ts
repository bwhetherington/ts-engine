import {LogManager} from 'core/log';
import {Data} from 'core/serialize';

const log = LogManager.forFile(__filename);

type AssetLoader = (path: string) => Promise<Buffer>;

export class AssetManager {
  private loader?: AssetLoader;

  public initialize(loader: AssetLoader): void {
    this.loader = loader;
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

  public async load(
    path: string,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<string> {
    const buf = await this.loadBuffer(path);
    return buf.toString(encoding);
  }

  public async loadJSON(
    path: string,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<Data> {
    const str = await this.load(path, encoding);
    const obj = JSON.parse(str);
    return obj;
  }
}

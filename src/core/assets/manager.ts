import {LogManager} from 'core/log';
import {Data} from 'core/serialize';
import {BufferData} from 'core/util';
import yaml from 'js-yaml';

const log = LogManager.forFile(__filename);

type AssetLoader = (path: string) => Promise<BufferData>;

type DirectoryLoader = (path: string) => Promise<string[]>;

export class AssetManager {
  private loader?: AssetLoader;
  private directoryLoader?: DirectoryLoader;

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

  public async loadBuffer(path: string): Promise<BufferData> {
    if (this.loader) {
      const data = await this.loader(path);
      log.debug('load asset: ' + path);
      return data;
    } else {
      log.error('asset loader not specified');
      throw new Error('asset loader not specified');
    }
  }

  public async loadAllBuffers(paths: string[]): Promise<BufferData[]> {
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

  private parseFile(path: string, content: string): Data {
    const sections = path.split('.');
    let parse = (str: string) => JSON.parse(str);
    if (sections[1] === 'yml' || sections[1] === 'yaml') {
      parse = (str: string) => yaml.load(str);
    }
    return parse(content);
  }

  public async loadJSON(
    path: string,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<Data> {
    try {
      const str = await this.load(path, encoding);
      const obj = this.parseFile(path, str);
      return obj;
    } catch (ex) {
      log.error('Error reading JSON asset: ' + path);
      throw ex;
    }
  }

  public async loadAllJSON(
    paths: string[],
    encoding: BufferEncoding = 'utf-8'
  ): Promise<Data[]> {
    return Promise.all(paths.map((path) => this.loadJSON(path, encoding)));
  }
}

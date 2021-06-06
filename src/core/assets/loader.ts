import {Data, Serializable} from 'core/serialize';
import {AssetManager} from 'core/assets';
import {Iterator} from 'core/iterator';
import {LogManager} from 'core/log';

const log = LogManager.forFile(__filename);

export interface Asset extends Serializable {
  type: string;
}

export interface AssetTemplate extends Data {
  type: string;
  extends: string;
}

export type AssetType<T extends Asset> = {
  typeName: string;
} & (new () => T);

type AssetInitializer<T extends Asset> = () => T;

export class LoadingManager<T extends Asset> {
  private initializers: Record<string, AssetInitializer<T>> = {};
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public registerAssetType(Type: AssetType<T>): void {
    this.registerAssetInitializer(Type.typeName, () => new Type());
  }

  public registerAssetTemplate(template: AssetTemplate): void {
    const {type, extends: base} = template;
    const baseInitializer = this.initializers[base];

    if (!baseInitializer) {
      throw new Error(`base type ${type} not found`);
    }

    const initializer = () => {
      const instance = baseInitializer();
      instance.deserialize(template, false);
      instance.type = type;
      return instance;
    };

    this.registerAssetInitializer(type, initializer);
  }

  public async loadAssetTemplates(dir: string): Promise<void> {
    const paths = await AssetManager.loadDirectory(dir);
    const templates = await AssetManager.loadAllJSON(paths);

    Iterator.from(templates)
      .filter((template) => typeof template.type === 'string')
      .map((template) => template as AssetTemplate)
      .forEach((template) => {
        this.registerAssetTemplate(template);
      });
  }

  public registerAssetInitializer(
    type: string,
    initializer: AssetInitializer<T>
  ): void {
    this.initializers[type] = initializer;
    log.debug(`${this.name} registered asset: ${type}`);
  }

  public instantiate(type: string): T | undefined {
    const initializer = this.initializers[type];

    if (!initializer) {
      log.warn(`${this.name} failed to instantiate type: ${type}`);
      return undefined;
    }

    const asset = initializer();
    asset.type = type;
    log.trace(`${this.name} created instance of ${type}`);
    return asset;
  }

  public instantiateType<U extends T>(Type: AssetType<U>): U | undefined {
    const instance = this.instantiate(Type.typeName);

    if (!instance) {
      return undefined;
    }

    return instance as U;
  }

  protected getAssetInitializers(): Iterator<[string, AssetInitializer<T>]> {
    return Iterator.entries(this.initializers);
  }
}

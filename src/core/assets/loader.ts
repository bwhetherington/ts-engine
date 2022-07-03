import {Data, Serializable} from '@/core/serialize';
import {AssetManager} from '@/core/assets';
import {Iterator} from '@/core/iterator';
import {LogManager} from '@/core/log';

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
  initializeType?: () => void;
} & (new () => T);

type AssetInitializer<T extends Asset> = () => T;

export type CustomAsset = {
  type: string;
} & Data;

export type AssetIdentifier = string | CustomAsset;

export function isAssetIdentifier(ident: any): ident is AssetIdentifier {
  if (typeof ident === 'string') {
    return true;
  }

  if (typeof ident === 'object') {
    if (typeof ident.type === 'string') {
      return true;
    }
  }

  return false;
}

export class LoadingManager<T extends Asset> {
  private initializers: Record<string, AssetInitializer<T>> = {};
  private usedTypeInitializers: Set<() => void> = new Set();
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public registerAssetType(Type: AssetType<T>) {
    this.registerAssetInitializer(Type.typeName, () => new Type());
    const typeInitializer = Type.initializeType?.bind(Type);

    if (typeInitializer && !this.usedTypeInitializers.has(typeInitializer)) {
      typeInitializer();
    }
  }

  public registerAssetTypes(...types: AssetType<T>[]) {
    for (const Type of types) {
      this.registerAssetType(Type);
    }
  }

  protected registerAssetTemplate(template: AssetTemplate) {
    const {type, extends: base} = template;

    const baseInitializer = this.initializers[base];

    if (!baseInitializer) {
      throw new Error(`base type ${base} not found for type ${type}`);
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
    const paths = await AssetManager.walkDirectory(dir).toArray();
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
  ) {
    this.initializers[type] = initializer;
    log.debug(`${this.name} registered asset: ${type}`);
  }

  public canInstantiate(type: string): boolean {
    return this.initializers.hasOwnProperty(type);
  }

  public instantiate(ident: string | CustomAsset): T | undefined {
    if (typeof ident === 'string') {
      const initializer = this.initializers[ident];

      if (!initializer) {
        log.warn(`${this.name} failed to instantiate type: ${ident}`);
        return undefined;
      }

      const asset = initializer();
      asset.type = ident;
      log.trace(`${this.name} created instance of ${ident}`);
      return asset;
    } else {
      const {type, ...data} = ident;
      const asset = this.instantiate(type);
      asset?.deserialize(data);
      return asset;
    }
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

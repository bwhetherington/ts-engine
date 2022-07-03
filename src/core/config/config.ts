import {Asset} from '@/core/assets';
import {Iterator} from '@/core/iterator';
import {Data, Serializable} from '@/core/serialize';

export class Config implements Asset, Serializable {
  public static typeName: string = 'Config';
  public type: string = Config.typeName;

  private data: Map<string, any> = new Map();

  public serialize(): Data {
    return Iterator.map(this.data).fold({} as Data, (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    });
  }

  public deserialize(data: Data): void {
    Iterator.entries(data).forEach(([key, value]) => {
      this.data.set(key, value);
    });
  }

  public get(key: string): any {
    return this.data.get(key);
  }
}

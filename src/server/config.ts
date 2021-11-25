import {AssetManager} from 'core/assets';
import {Data, Serializable} from 'core/serialize';

export class Config implements Serializable {
  public tickRate: number = 30;

  public static async load(file: string): Promise<Config> {
    const config = new Config();
    const options = await AssetManager.loadJSON(file);
    config.deserialize(options);
    return config;
  }

  public serialize(): Data {
    return {
      tickRate: this.tickRate,
    };
  }

  public deserialize(data: Data): void {
    const {tickRate} = data;
    if (typeof tickRate === 'number') {
      this.tickRate = tickRate;
    }
  }
}

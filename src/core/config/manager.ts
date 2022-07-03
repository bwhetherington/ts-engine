import {LoadingManager} from '@/core/assets';
import {Config} from '@/core/config/config';

export class ConfigManager extends LoadingManager<Config> {
  private configMap: Map<string, Config> = new Map();

  public constructor() {
    super('ConfigManager');
  }

  public async initialize() {
    this.registerAssetType(Config);
    await this.loadAssetTemplates('config/configs');
  }

  public getConfig(name: string): Config {
    let config = this.configMap.get(name);
    if (!config) {
      config = this.instantiate(name);
      if (!config) {
        throw new Error(`Could not locate config: ${name}`);
      }
      this.configMap.set(name, config);
    }
    return config;
  }
}

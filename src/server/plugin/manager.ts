import {Iterator} from '@/core/iterator';
import {UUID, UUIDManager} from '@/core/uuid';
import {Server} from '@/server/net';
import {Plugin} from '@/server/plugin';

type PluginType = (new () => Plugin) & typeof Plugin;

export class PluginManager {
  private registeredPlugins: Record<string, PluginType> = {};
  private plugins: Record<string, Plugin> = {};
  private server?: Server;

  public registerPlugin(ToRegister: PluginType) {
    this.registeredPlugins[ToRegister.typeName] = ToRegister;
  }

  public getPlugins(): Iterator<Plugin> {
    return Iterator.values(this.plugins);
  }

  public async loadPlugin(pluginType: PluginType | string): Promise<boolean> {
    let ToLoad: PluginType;
    if (typeof pluginType === 'string') {
      ToLoad = this.registeredPlugins[pluginType];
    } else {
      ToLoad = pluginType;
      if (!this.registeredPlugins.hasOwnProperty(ToLoad.typeName)) {
        this.registerPlugin(ToLoad);
      }
    }

    if (ToLoad) {
      const plugin = new ToLoad();
      plugin.name = ToLoad.typeName;
      this.plugins[plugin.name] = plugin;

      if (this.server) {
        await plugin.initialize(this.server);
        return true;
      }
    }
    return false;
  }

  public async loadPlugins(plugins: (PluginType | string)[]): Promise<void> {
    await Promise.all(plugins.map(this.loadPlugin.bind(this)));
  }

  public async initialize(server: Server): Promise<void> {
    this.server = server;
  }

  public async unloadPlugin(name: string): Promise<boolean> {
    if (this.plugins.hasOwnProperty(name)) {
      await this.plugins[name].cleanup();
      delete this.plugins[name];
      return true;
    } else {
      return false;
    }
  }

  public async cleanup(): Promise<void> {
    const plugins = Iterator.keys(this.plugins).toArray();
    for (const plugin of plugins) {
      await this.unloadPlugin(plugin);
    }
  }
}

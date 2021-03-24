import {Server} from 'server/net';
import {Plugin} from 'server/plugin';

export class PluginManager {
  private plugins: Plugin[] = [];
  private server?: Server;

  public async loadPlugin(ToLoad: new () => Plugin): Promise<void> {
    const plugin = new ToLoad();
    this.plugins.push(plugin);

    if (this.server) {
      await plugin.initialize(this.server);
    }
  }

  public async loadPlugins(plugins: (new () => Plugin)[]): Promise<void> {
    await Promise.all(plugins.map(this.loadPlugin.bind(this)));
  }

  public async initialize(server: Server): Promise<void> {
    this.server = server;
  }

  public async cleanup(): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.cleanup();
    }
  }
}

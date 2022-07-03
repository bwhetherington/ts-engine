import {Player} from '@/core/player';

import {ChatManager} from '@/server/chat';
import {Server} from '@/server/net';
import {Plugin, PluginManager} from '@/server/plugin';

async function handleLoadPlugin(player: Player, name?: string): Promise<void> {
  if (name) {
    if (await PluginManager.loadPlugin(name)) {
      ChatManager.info(`Plugin ${name} has been loaded`, player);
    } else {
      ChatManager.info(`Plugin ${name} could not be loaded`, player);
    }
  }
}

async function handleUnloadPlugin(
  player: Player,
  name?: string
): Promise<void> {
  if (name) {
    const wasPresent = await PluginManager.unloadPlugin(name);
    if (wasPresent) {
      ChatManager.info(`Plugin ${name} has been unloaded`, player);
    } else {
      ChatManager.info(`Plugin ${name} could not be found`, player);
    }
  } else {
    ChatManager.info('No plugin specified', player);
  }
}

async function handleListPlugins(player: Player): Promise<void> {
  const pluginNames = PluginManager.getPlugins()
    .map((plugin) => plugin.name)
    .toArray()
    .join(', ');
  ChatManager.info(`Plugins: ${pluginNames}`, player);
}

export class LoaderPlugin extends Plugin {
  public static typeName: string = 'LoaderPlugin';

  public async initialize(server: Server): Promise<void> {
    this.registerCommand({
      name: 'plugin',
      help: 'Load and unload plugins',
      permissionLevel: 1,
      async handler(player, sub, ...args) {
        switch (sub) {
          case 'load':
            await handleLoadPlugin(player, args[0]);
            break;
          case 'unload':
            await handleUnloadPlugin(player, args[0]);
            break;
          case 'list':
            await handleListPlugins(player);
            break;
          default:
            ChatManager.info(`subcommand: '${sub}' was not recognized`, player);
            break;
        }
      },
    });

    await super.initialize(server);
  }
}

import {Player} from '@/core/player';

import {ChatManager} from '@/server/chat';
import {Server} from '@/server/net';
import {Plugin} from '@/server/plugin';

export class UtilsPlugin extends Plugin {
  public static typeName: string = 'UtilsPlugin';

  private getPing(player: Player) {
    const pingMs = Math.round(player.ping * 100000) / 100;
    ChatManager.info(`Ping: ${pingMs} ms`, player);
  }

  public async initialize(server: Server): Promise<void> {
    this.registerCommand({
      name: 'ping',
      help: "Gets the player's latency",
      handler: this.getPing.bind(this),
    });
    await super.initialize(server);
  }
}

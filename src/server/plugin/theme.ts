import {NetworkManager} from '@/core/net';
import {SetThemeEvent} from '@/core/theme';
import {ChatManager} from '@/server/chat';
import {Server} from '@/server/net';
import {Plugin} from '@/server/plugin';

export class ThemePlugin extends Plugin {
  public static override typeName: string = 'ThemePlugin';

  public async initialize(server: Server): Promise<void> {
    super.initialize(server);
    this.registerCommand({
      name: 'theme',
      help: "Sets the player's theme to light or dark",
      permissionLevel: 0,
      async handler(player, theme) {
        if (!theme) {
          ChatManager.error('No theme specified', player);
        }
        ChatManager.info(`Set theme to: ${theme}`, player);
        NetworkManager.sendEvent<SetThemeEvent>(
          {
            type: 'SetThemeEvent',
            data: {
              theme,
            },
          },
          player.socket
        );
      },
    });
  }
}

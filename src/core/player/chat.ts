import { renderMessage, TextComponents, TextMessageOutEvent } from 'core/chat';
import { Event, EventManager } from 'core/event';
import { NetworkManager } from 'core/net';
import { Player } from 'core/player';

export class PlayerChatManager {
  public constructor(private player: Player) {}

  public send(content: string, from?: string): void {
    const isServer = NetworkManager.isServer();
    const isActivePlayer = this.player.isActivePlayer();
    if (isServer || isActivePlayer) {
      let message: TextComponents;
      if (from) {
        message = renderMessage(from, content);
      } else {
        message = [content];
      }
      const event: Event<TextMessageOutEvent> = {
        type: 'TextMessageOutEvent',
        data: {
          components: message,
        },
      };
      if (isServer) {
        NetworkManager.sendEvent(event);
      } else {
        EventManager.emit(event);
      }
    }
  }
}

import {renderMessage, TextComponents, TextMessageOutEvent} from '@/core/chat';
import {EventManager, makeEvent} from '@/core/event';
import {NetworkManager} from '@/core/net';
import {Player} from '@/core/player';

export class PlayerChatManager {
  public constructor(private player: Player) {}

  public send(content: string, from?: string) {
    const isServer = NetworkManager.isServer();
    const isActivePlayer = this.player.isActivePlayer();
    if (isServer || isActivePlayer) {
      let message: TextComponents;
      if (from) {
        message = renderMessage(from, content);
      } else {
        message = [content];
      }
      const event = makeEvent(TextMessageOutEvent, {
        components: message,
      });
      if (isServer) {
        NetworkManager.sendEvent(event);
      } else {
        EventManager.emit(event);
      }
    }
  }
}

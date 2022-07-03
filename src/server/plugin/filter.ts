import {TextMessageInEvent} from '@/core/chat';
import {EventManager, Priority} from '@/core/event';

import {ChatManager} from '@/server/chat';
import {Server} from '@/server/net';
import {Plugin} from '@/server/plugin';

const FILTER_WORDS = ['badword'];

export class FilterPlugin extends Plugin {
  public static typeName: string = 'FilterPlugin';

  public async initialize(server: Server): Promise<void> {
    await super.initialize(server);

    this.streamEvents(TextMessageInEvent, Priority.High, true)
      .filter((event) =>
        FILTER_WORDS.some((word) => event.data.content.includes(word))
      )
      .forEach((event) => {
        // Reprimand player
        ChatManager.warn("Don't use such foul language!", event.socket);

        // Stop the event
        EventManager.stopPropagation();
      });
  }
}

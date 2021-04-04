import fs from 'fs';

import {
  TextComponents,
  TextMessageInEvent,
  TextMessageOutEvent,
} from 'core/chat';

import {Server} from 'server/net';
import {Plugin} from 'server/plugin';
import {Priority} from 'core/event';
import {PlayerManager} from 'core/player';

const LOG_FILE = 'chat.log';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
};

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', DATE_OPTIONS);

function generateString(components: TextComponents): string {
  const time = Date.now();
  const timeString = DATE_FORMAT.format(time);
  let output = `[${timeString}] `;

  for (const component of components) {
    if (component === null) {
      output += '\n';
    } else if (typeof component === 'string') {
      output += component;
    } else {
      output += component.content;
    }
  }

  return output;
}

export class ChatLogPlugin extends Plugin {
  public static typeName: string = 'ChatLogPlugin';

  private handle?: fs.WriteStream;

  private writeLine(line: string): void {
    this.handle?.write(line + '\n');
  }

  public async override initialize(server: Server): Promise<void> {
    // Acquire file handle
    this.handle = fs.createWriteStream(LOG_FILE, {
      flags: 'a',
    });

    this.streamEvents<TextMessageOutEvent>(
      'TextMessageOutEvent',
      Priority.Highest
    )
      .filter((event) => event.socket === -1)
      .map((event) => generateString(event.data.components))
      .forEach((line) => {
        this.writeLine(line);
      });

    await super.initialize(server);
  }

  public async override cleanup(): Promise<void> {
    this.handle?.end();
    await super.cleanup();
  }
}

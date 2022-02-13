import fs from 'fs';
import {Server} from '@/server/net';
import {Plugin} from '@/server/plugin';
import {UpdateKeysEvent} from '@/core/serialize';

const LOG_FILE = 'keys.log';

export class LogKeysPlugin extends Plugin {
  public static typeName: string = 'LogKeysPlugin';

  private handle?: fs.WriteStream;

  private writeLine(line: string) {
    this.handle?.write(line + '\n');
  }

  public async initialize(server: Server): Promise<void> {
    // Acquire file handle
    this.handle = fs.createWriteStream(LOG_FILE, {
      flags: 'a',
    });

    this.streamEvents<UpdateKeysEvent>('UpdateKeysEvent').forEach((event) => {
      const line = JSON.stringify(event.data.keys);
      this.writeLine(line);
    });

    await super.initialize(server);
  }

  public async cleanup(): Promise<void> {
    this.handle?.end();
    await super.cleanup();
  }
}

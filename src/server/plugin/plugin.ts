import {Server} from 'server/net';
import {LogManager} from 'core/log';
import {Observer} from 'core/event';

const log = LogManager.forFile(__filename);

export abstract class Plugin extends Observer {
  protected type: string = 'Plugin';

  public async initialize(server: Server): Promise<void> {
    log.debug(`plugin ${this.type} initialized`);
  }

  public async cleanup(): Promise<void> {
    super.cleanup();
    log.debug(`plugin ${this.type} cleaned up`);
  }
}

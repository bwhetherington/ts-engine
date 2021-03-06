import {Server} from 'server/net';
import {LogManager} from 'core/log';
import {Observer} from 'core/event';
import {ChatManager, CommandEntry} from 'server/chat';

const log = LogManager.forFile(__filename);

export abstract class Plugin extends Observer {
  public static typeName: string = 'Plugin';

  private registeredCommands: Set<string> = new Set();
  public name: string = Plugin.typeName;

  public async initialize(server: Server): Promise<void> {
    log.debug(`plugin ${this.name} initialized`);
  }

  public async cleanup(): Promise<void> {
    super.cleanup();
    for (const command of this.registeredCommands) {
      ChatManager.removeCommand(command);
    }
    log.debug(`plugin ${this.name} cleaned up`);
  }

  public registerCommand(command: CommandEntry): void {
    this.registeredCommands.add(command.name);
    ChatManager.registerCommandEntry(command);
  }
}

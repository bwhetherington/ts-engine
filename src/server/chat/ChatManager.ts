import { EM, Event } from 'core/event';
import { Socket, NM } from 'core/net';
import {
  TextMessageInEvent,
  SetNameEvent,
  TextMessageOutEvent,
  TextComponent,
  TextCommandEvent,
} from 'core/chat';
import { LM } from 'core/log';

const DEFAULT_NAME = 'Unknown';

type Command = (socket: Socket, ...args: string[]) => void;

export class ChatManager {
  private names: { [socket: number]: string } = {};
  private commands: { [command: string]: Command } = {};

  private getName(socket: Socket): string {
    return this.names[socket] ?? DEFAULT_NAME;
  }

  public registerCommand(command: string, handler: Command): void {
    this.commands[command] = handler;
  }

  private handleCommand(socket: Socket, command: string, args: string[]): void {
    if (command in this.commands) {
      const handler = this.commands[command];
      handler.apply(null, [socket, ...args]);
    } else {
      this.error(`command '${command}' is undefined`, socket);
    }
  }

  private formatMessage(
    author: string,
    content: string
  ): (string | TextComponent)[] {
    return [
      {
        content: `<${author}>`,
        style: {
          color: 'none',
          styles: ['bold'],
        },
      },
      ' ',
      content,
    ];
  }

  public initialize(): void {
    LM.debug('ChatManager initialized');

    EM.addListener('SetNameEvent', (event: Event<SetNameEvent>) => {
      const { data, socket } = event;
      if (socket !== undefined) {
        this.names[socket] = data.name;
        LM.debug(`player ${socket} set name to ${data.name}`);
      } else {
        LM.error('unknown socket');
      }
    });

    EM.addListener('TextMessageInEvent', (event: Event<TextMessageInEvent>) => {
      LM.info(JSON.stringify(this.names));

      LM.info(event.data.content);
      const { data, socket } = event;

      let name = DEFAULT_NAME;
      if (socket !== undefined) {
        name = this.getName(socket);
      }

      const components = this.formatMessage(name, event.data.content);
      this.sendComponents(components);
    });

    EM.addListener('TextCommandEvent', (event: Event<TextCommandEvent>) => {
      const { socket, data } = event;
      if (socket !== undefined) {
        this.handleCommand(socket, data.command, data.args);
      }
    });

    this.registerCommand('ping', (socket) => {
      this.info('Pong!', socket);
    });
  }

  private renderInfo(message: string): (string | TextComponent)[] {
    return [
      {
        content: 'Info:',
        style: {
          color: 'yellow',
          styles: ['bold'],
        },
      },
      ' ',
      {
        content: message,
        style: {
          color: 'yellow',
        },
      },
    ];
  }

  private renderWarn(message: string): (string | TextComponent)[] {
    return [
      {
        content: 'Warn:',
        style: {
          color: 'orange',
          styles: ['bold'],
        },
      },
      ' ',
      {
        content: message,
        style: {
          color: 'orange',
        },
      },
    ];
  }

  private renderError(message: string): (string | TextComponent)[] {
    return [
      {
        content: 'Error:',
        style: {
          color: 'red',
          styles: ['bold'],
        },
      },
      ' ',
      {
        content: message,
        style: {
          color: 'red',
        },
      },
    ];
  }

  private sendComponents(
    components: (string | TextComponent)[],
    socket: number = -1
  ): void {
    const outEvent = {
      type: 'TextMessageOutEvent',
      data: <TextMessageOutEvent>{
        components,
      },
    };
    NM.send(outEvent, socket);
  }

  public info(message: string, socket: number = -1): void {
    const components = this.renderInfo(message);
    this.sendComponents(components, socket);
    LM.info(message);
  }

  public warn(message: string, socket: number = -1): void {
    const components = this.renderWarn(message);
    this.sendComponents(components, socket);
    LM.warn(message);
  }

  public error(message: string, socket: number = -1): void {
    const components = this.renderError(message);
    this.sendComponents(components, socket);
    LM.error(message);
  }
}

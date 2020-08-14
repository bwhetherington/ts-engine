import { EventManager, Event } from 'core/event';
import { Socket, NetworkManager } from 'core/net';
import {
  TextMessageInEvent,
  SetNameEvent,
  TextMessageOutEvent,
  TextComponent,
  TextCommandEvent,
  renderInfo,
  renderWarn,
  renderError,
} from 'core/chat';
import { LogManager } from 'core/log';
import { PlayerManager } from 'core/player';
import { WorldManager, Tank, Enemy } from 'core/entity';
import { TimerManager } from 'server/util';
import { Pistol } from 'core/weapon';

const log = LogManager.forFile(__filename);

const DEFAULT_NAME = 'Unknown';

type CommandHandler = (socket: Socket, ...args: string[]) => void;

interface Command {
  name: string;
  help: string;
  handler: CommandHandler;
}

export class ChatManager {
  private commands: { [command: string]: Command } = {};
  private aliases: { [alias: string]: string } = {};

  public registerCommand(
    command: string,
    handler: CommandHandler,
    help: string,
    ...aliases: string[]
  ): void {
    const entry = {
      name: command,
      handler,
      help,
    };
    this.commands[command] = entry;
    for (const alias of aliases) {
      this.aliases[alias] = command;
    }
  }

  private handleCommand(socket: Socket, command: string, args: string[]): void {
    if (command in this.commands) {
      const handler = this.commands[command];
      handler.handler.apply(null, [socket, ...args]);
    } else if (command in this.aliases) {
      const handler = this.commands[this.aliases[command]];
      handler.handler.apply(null, [socket, ...args]);
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
    log.debug('ChatManager initialized');

    EventManager.addListener<SetNameEvent>('SetNameEvent', (event) => {
      const { data, socket } = event;

      if (socket !== undefined) {
        const player = PlayerManager.getPlayer(socket);
        if (player) {
          player.name = data.name;
          log.debug(`player ${socket} set name to ${data.name}`);
        } else {
          log.error(`player ${socket} not found`);
        }
      } else {
        log.error('unknown socket');
      }
    });

    EventManager.addListener<TextMessageInEvent>('TextMessageInEvent', (event) => {
      const { data, socket } = event;

      let name = DEFAULT_NAME;
      if (socket !== undefined) {
        name = PlayerManager.getPlayer(socket)?.name ?? DEFAULT_NAME;
      }

      const components = this.formatMessage(name, event.data.content);
      this.sendComponents(components);

      log.info(`<${name}> ${data.content}`);
    });

    EventManager.addListener<TextCommandEvent>('TextCommandEvent', (event) => {
      const { socket, data } = event;
      if (socket !== undefined) {
        this.handleCommand(socket, data.command, data.args);
      }
    });

    this.registerCommand(
      'help',
      (socket) => {
        const components = renderInfo('Command Directory');
        for (const command in this.commands) {
          const entry = this.commands[command];
          components.push(
            null,
            {
              content: "'" + entry.name + "':",
              style: {
                color: 'yellow',
                styles: ['bold'],
              },
            },
            {
              content: ' ' + entry.help,
              style: {
                color: 'yellow',
              },
            }
          );
        }
        this.sendComponents(components, socket);
      },
      'Lists all commands and their help messages.',
      'h'
    );

    this.registerCommand(
      'ping',
      (socket) => {
        this.info('Pong!', socket);
      },
      "Responds to the user's ping with a pong.",
      'p'
    );

    this.registerCommand(
      'rename',
      (socket, name) => {
        if (typeof name === 'string') {
          const player = PlayerManager.getPlayer(socket);
          if (player) {
            player.name = name;
            this.info(`Set name to '${name}'`, socket);
          }
        } else {
          this.error('Name not specified.', socket);
        }
      },
      "Sets the player's name.",
      'rn',
      'nick'
    );

    this.registerCommand(
      'spawn',
      (socket, countString) => {
        if (countString === undefined) {
          this.error('No entity count specified.', socket);
          return;
        }
        const count = parseInt(countString);
        if (Number.isNaN(count)) {
          this.error(`Could not parse '${countString}' as integer.`, socket);
          return;
        }

        for (let i = 0; i < count; i++) {
          const entity = WorldManager.spawn(Enemy);

          entity.color = {
            red: Math.random() * 0.2 + 0.7,
            green: Math.random() * 0.2 + 0.7,
            blue: Math.random() * 0.2 + 0.7,
          };

          const x = Math.random() * WorldManager.boundingBox.width + WorldManager.boundingBox.x;
          const y = Math.random() * WorldManager.boundingBox.height + WorldManager.boundingBox.y;

          // const dx = (Math.random() - 0.5) * 200;
          // const dy = (Math.random() - 0.5) * 200;

          entity.position.setXY(x, y);
          // entity.velocity.setXY(dx, dy);

          const weapon = new Pistol();
          weapon.rate = 0.85;
          weapon.damage = 12;
          entity.setWeapon(weapon);
        }

        this.info(`Spawning ${count} entities.`);
      },
      'Spawns a number of AI units.'
    );

    this.registerCommand(
      'kill',
      (socket) => {
        WorldManager.getEntities()
          .filter((entity) => entity.type === 'Enemy')
          .forEach((entity) => {
            entity.markForDelete();
          });
        this.info('Removed all units.');
      },
      'Kills all units.'
    );

    this.registerCommand(
      'setinterval',
      (socket, intervalString) => {
        if (intervalString === undefined) {
          this.error('No interval specified.', socket);
          return;
        }

        const interval = parseFloat(intervalString);
        if (Number.isNaN(interval)) {
          this.error(`Could not parse '${intervalString}' as a float.`, socket);
          return;
        }

        this.info(intervalString + ',' + interval);

        TimerManager.setInterval(interval);
      },
      'Sets the server clock interval.'
    );
  }

  private sendComponents(
    components: (string | null | TextComponent)[],
    socket: number = -1
  ): void {
    const outEvent = {
      type: 'TextMessageOutEvent',
      data: <TextMessageOutEvent>{
        components,
      },
    };
    NetworkManager.send(outEvent, socket);
  }

  public info(message: string, socket: number = -1): void {
    const components = renderInfo(message);
    this.sendComponents(components, socket);
    log.info(message);
  }

  public warn(message: string, socket: number = -1): void {
    const components = renderWarn(message);
    this.sendComponents(components, socket);
    log.warn(message);
  }

  public error(message: string, socket: number = -1): void {
    const components = renderError(message);
    this.sendComponents(components, socket);
    log.error(message);
  }
}

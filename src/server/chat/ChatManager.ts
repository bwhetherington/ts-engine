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
import { PlayerManager, Player } from 'core/player';
import { WorldManager, Tank, Enemy, Unit } from 'core/entity';
import { TimerManager } from 'server/util';
import { Pistol } from 'core/weapon';
import { randomColor } from 'core/graphics/color';

const log = LogManager.forFile(__filename);

const DEFAULT_NAME = 'Unknown';

type CommandHandler = (player: Player, ...args: string[]) => void;

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

  private handleCommand(player: Player, command: string, args: string[]): void {
    if (command in this.commands) {
      const handler = this.commands[command];
      handler.handler.apply(null, [player, ...args]);
    } else if (command in this.aliases) {
      const handler = this.commands[this.aliases[command]];
      handler.handler.apply(null, [player, ...args]);
    } else {
      this.error(`command '${command}' is undefined`, player);
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

    EventManager.addListener<TextMessageInEvent>(
      'TextMessageInEvent',
      (event) => {
        const { data, socket } = event;

        const player = PlayerManager.getPlayer(socket);
        if (player) {
          const { name, hasJoined } = player;
          if (hasJoined) {
            const components = this.formatMessage(name, event.data.content);
            this.sendComponents(components);
            log.info(`[<${name}> ${data.content}]`);
          }
        }
      }
    );

    EventManager.addListener<TextCommandEvent>('TextCommandEvent', (event) => {
      const { socket, data } = event;
      const player = PlayerManager.getPlayer(socket);
      if (player && player.hasJoined) {
        this.handleCommand(player, data.command, data.args);
      }
    });

    this.registerCommand(
      'help',
      (player) => {
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
        this.sendComponents(components, player);
      },
      'Lists all commands and their help messages',
      'h'
    );

    this.registerCommand(
      'ping',
      (player) => {
        this.info('Pong!', player);
      },
      "Responds to the user's ping with a pong",
      'p'
    );

    this.registerCommand(
      'rename',
      (player, name) => {
        if (typeof name === 'string') {
          player.name = name;
          this.info(`Set name to '${name}'`, player);
        } else {
          this.error('Name not specified', player);
        }
      },
      "Sets the player's name",
      'rn',
      'nick'
    );

    this.registerCommand(
      'spawn',
      (player, countString) => {
        if (countString === undefined) {
          this.error('No entity count specified', player);
          return;
        }
        const count = parseInt(countString);
        if (Number.isNaN(count)) {
          this.error(`Could not parse '${countString}' as integer`, player);
          return;
        }

        for (let i = 0; i < count; i++) {
          const entity = WorldManager.spawn(Enemy);

          const color = randomColor(0.35, 0.75);
          entity.setColor(color);

          const x =
            Math.random() * WorldManager.boundingBox.width +
            WorldManager.boundingBox.x;
          const y =
            Math.random() * WorldManager.boundingBox.height +
            WorldManager.boundingBox.y;

          // const dx = (Math.random() - 0.5) * 200;
          // const dy = (Math.random() - 0.5) * 200;

          entity.position.setXY(x, y);
          // entity.velocity.setXY(dx, dy);

          const weapon = new Pistol();
          weapon.rate = 0.85;
          weapon.damage = 1;
          entity.setWeapon(weapon);
        }

        this.info(`Spawning ${count} entities`);
      },
      'Spawns a number of AI units'
    );

    this.registerCommand(
      'heal',
      (player) => {
        const { hero } = player;
        if (hero) {
          const life = hero.getMaxLife();
          hero.setLife(life);
          this.info('Healed to ' + life + ' life', player);
        }
      },
      "Heals the player's hero to maximum life"
    );

    this.registerCommand(
      'kill',
      () => {
        WorldManager.getEntities()
          .filterType((entity): entity is Unit => entity instanceof Unit)
          .forEach((unit) => {
            unit.kill();
          });
        this.info('Removed all units');
      },
      'Kills all units'
    );

    this.registerCommand(
      'setinterval',
      (player, intervalString) => {
        if (intervalString === undefined) {
          this.error('No interval specified', player);
          return;
        }

        const interval = parseFloat(intervalString);
        if (Number.isNaN(interval)) {
          this.error(`Could not parse '${intervalString}' as a float`, player);
          return;
        }

        this.info(intervalString + ',' + interval);

        TimerManager.setInterval(interval);
      },
      'Sets the server clock interval'
    );
  }

  private sendComponents(
    components: (string | null | TextComponent)[],
    target: number | Player = -1
  ): void {
    const outEvent = {
      type: 'TextMessageOutEvent',
      data: <TextMessageOutEvent>{
        components,
      },
    };
    const socket = target instanceof Player ? target.socket : target;
    NetworkManager.send(outEvent, socket);
  }

  public info(message: string, target: number | Player = -1): void {
    const components = renderInfo(message);
    this.sendComponents(components, target);
    log.info('[' + message + ']');
  }

  public warn(message: string, target: number | Player = -1): void {
    const components = renderWarn(message);
    this.sendComponents(components, target);
    log.warn('[' + message + ']');
  }

  public error(message: string, target: number | Player = -1): void {
    const components = renderError(message);
    this.sendComponents(components, target);
    log.error('[' + message + ']');
  }
}

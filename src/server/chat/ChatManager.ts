import { EventManager, Event } from 'core/event';
import { NetworkManager } from 'core/net';
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
import { WorldManager, Enemy, Unit } from 'core/entity';
import { TimerManager } from 'server/util';
import { randomColor } from 'core/graphics/color';
import { FormManager } from 'core/form';
import * as process from 'process';
import { CommandEntry } from 'server/chat';
import * as commands from 'server/chat/commands';
import { iterateObject } from 'core/iterator';

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

  private loadCommands(): void {
    iterateObject(commands).forEach(this.registerCommandEntry.bind(this));
  }

  public registerCommandEntry(command: CommandEntry): void {
    this.registerCommand(
      command.name,
      command.handler,
      command.help,
      ...(command.aliases ?? [])
    );
  }

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
      async (player) => {
        if (!(await FormManager.sendForm(player, 'RenameForm'))) {
          this.error('Error handling form', player);
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
          const isHeavy = Math.random() < 0.2;
          const type = isHeavy ? 'HeavyEnemy' : 'Enemy';
          const entity = WorldManager.spawnEntity(type) as Enemy;

          const color = randomColor();
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

          // const weapon = new Pistol();
          // weapon.rate = 0.85;
          // weapon.damage = 1;
          // entity.setWeapon(weapon);
        }

        this.info(`Spawning ${count} entities`);
      },
      'Spawns a number of AI units'
    );

    this.registerCommand(
      'feed',
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
          const entity = WorldManager.spawnEntity('Feed');
          const x =
            Math.random() * WorldManager.boundingBox.width +
            WorldManager.boundingBox.x;
          const y =
            Math.random() * WorldManager.boundingBox.height +
            WorldManager.boundingBox.y;
          entity.position.setXY(x, y);
        }

        this.info(`Spawning ${count} entities`);
      },
      'Spawns a number of feed units'
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
      'stop',
      (player) => {
        this.info('Stopping the server');
        process.exit(0);
      },
      'Stops the server'
    );

    this.registerCommand(
      'setlevel',
      (player, levelString) => {
        if (levelString === undefined) {
          this.error('No level specified', player);
          return;
        }

        const level = parseInt(levelString);
        if (Number.isNaN(level)) {
          this.error(`Could not parse '${levelString} as an int`, player);
          return;
        }

        if (level <= 0) {
          this.error('Level must be positive', player);
          return;
        }

        player.hero?.setLevel(level);
      },
      'Sets the level of the player character'
    );

    this.registerCommand(
      'setclass',
      (player, className) => {
        if (className === undefined) {
          this.error('No class specified', player);
          return;
        }

        if (player.setClass(className)) {
          this.info(`Set class to '${className}'`, player);
        } else {
          this.error(`Could not set class to '${className}'`, player);
        }
      },
      'Changes the player class'
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

    this.registerCommand(
      'lookup',
      (player, name) => {
        if (name === undefined) {
          this.error('No player specified', player);
          return;
        }

        const players = PlayerManager.lookup(name);

        if (players.length === 0) {
          this.info('No players found', player);
          return;
        }

        if (players.length === 1) {
          this.info('Player ID: ' + players[0].id);
          return;
        }

        const inner = players.map((player) => player.id).join(', ');
        this.info('Player IDs: ' + inner, player);
      },
      'Looks up the player ID associated with the given name'
    );

    this.registerCommand(
      'kick',
      (source, id) => {
        const target = PlayerManager.findPlayer(id);
        if (target) {
          this.error('You have been kicked from the game', target);
          target.disconnect();
        } else {
          this.error(`The player '${id}' does not exist`, source);
        }
      },
      'Kicks the player with the specified ID'
    );

    this.registerCommand(
      'sudo',
      (source, id, ...rest) => {
        const target = PlayerManager.findPlayer(id);
        const [command, ...args] = rest;
        if (target && command) {
          this.handleCommand(target, command, args);
        } else {
          this.error(`The player '${id}' does not exist`, source);
        }
      },
      'Executes a command from the specified player'
    );

    this.loadCommands();
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

import * as process from 'process';

import {EventManager, makeEvent} from '@/core/event';
import {NetworkManager} from '@/core/net';
import {
  TextMessageInEvent,
  SetNameEvent,
  TextMessageOutEvent,
  TextComponent,
  TextCommandEvent,
  TextComponents,
} from '@/core/chat';
import {LogManager} from '@/core/log';
import {PlayerManager, Player} from '@/core/player';
import {WorldManager, Unit, Feed, FeedVariant} from '@/core/entity';
import {randomColor} from '@/core/graphics/color';
import {FormManager} from '@/core/form';
import {Iterator} from '@/core/iterator';
import {RNGManager} from '@/core/random';
import {TextFormatter} from '@/core/chat/format';
import {Vector} from '@/core/geometry';

import {TimerManager} from '@/server/util';
import {CommandEntry} from '@/server/chat';
import * as commands from '@/server/chat/commands';

const log = LogManager.forFile(__filename);

const MESSAGE_FORMAT =
  '{style=bold|<}{color=$authorColor,style=bold|$authorName}{style=bold|>} $messageContent';

const SERVER_FORMAT = '{color=$color|$content}';

type CommandHandler = (player: Player, ...args: string[]) => void;

interface Command {
  name: string;
  help: string;
  permissionLevel: number;
  handler: CommandHandler;
}

export class ServerChatManager {
  private commands: {[command: string]: Command} = {};

  private chatFormatter: TextFormatter = new TextFormatter(MESSAGE_FORMAT);
  private serverMessageFormatter: TextFormatter = new TextFormatter(
    SERVER_FORMAT
  );

  private loadCommands() {
    Iterator.values(commands).forEach(this.registerCommandEntry.bind(this));
  }

  public removeCommand(name: string) {
    delete this.commands[name];
  }

  public registerCommandEntry(command: CommandEntry) {
    this.registerCommand(
      command.name,
      command.handler,
      command.help,
      command.permissionLevel ?? 0
    );
  }

  public registerCommand(
    command: string,
    handler: CommandHandler,
    help: string,
    permissionLevel: number
  ) {
    const entry = {
      name: command,
      handler,
      help,
      permissionLevel,
    };
    this.commands[command] = entry;
  }

  private handleCommand(player: Player, command: string, args: string[]) {
    if (command in this.commands) {
      const handler = this.commands[command];

      // Log call
      log.info(
        `command ${player.name}(${player.getPermissionLevel()}): ${command}(${
          handler.permissionLevel
        }): [${JSON.stringify(args)}]`
      );

      if ((player.getPermissionLevel() ?? 0) >= handler.permissionLevel) {
        handler.handler.apply(null, [player, ...args]);
      } else {
        this.error('Insufficient permissions', player);
      }
    } else {
      this.error(`Command '${command}' is undefined`, player);
    }
  }

  private formatMessage(author: Player, content: string): TextComponents {
    return this.chatFormatter.format({
      authorName: author.name,
      authorColor: author.getNameColor(),
      messageContent: content,
    });
  }

  public initialize() {
    log.debug('ChatManager initialized');

    EventManager.streamEventsForPlayer<SetNameEvent>('SetNameEvent').forEach(
      ({data, player}) => {
        player.name = data.name;
        log.debug(`player ${player.socket} set name to ${player.name}`);
      }
    );

    EventManager.streamEventsForPlayer(TextMessageInEvent)
      .filter(({player}) => player.hasJoined)
      .forEach(({data, player}) => {
        const {name} = player;
        const components = this.formatMessage(player, data.content);
        this.sendComponents(components);
        log.info(`[<${name}> ${data.content}]`);
      });

    EventManager.streamEventsForPlayer(TextCommandEvent)
      .filter(({player}) => player.hasJoined)
      .forEach(({data: {command, args}, player}) => {
        this.handleCommand(player, command, args);
      });

    this.registerCommand(
      'help',
      (player) => {
        // const components = renderInfo('Command Directory');
        const lines = Iterator.values(this.commands)
          .filter(
            (entry) => entry.permissionLevel <= player.getPermissionLevel()
          )
          .flatMap<null | TextComponent>((entry) =>
            Iterator.array([
              null,
              {
                content: entry.name + ':',
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
              },
              {
                content: '\n',
              },
            ])
          )
          .toArray();
        const components = [
          {
            content: '[Command Directory]',
            style: {
              color: 'yellow',
              styles: ['bold'],
            },
          } as TextComponent,
          ...lines,
        ];
        this.sendComponents(components, player);
      },
      'Lists all commands and their help messages',
      0
    );

    this.registerCommand(
      'ping',
      (player) => {
        this.info('Pong!', player);
      },
      "Responds to the user's ping with a pong",
      0
    );

    this.registerCommand(
      'rename',
      async (player) => {
        if (!(await FormManager.sendForm(player, 'RenameForm'))) {
          this.error('Error handling form', player);
        }
      },
      "Sets the player's name",
      0
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
          const x = RNGManager.nextFloat(
            WorldManager.boundingBox.x,
            WorldManager.boundingBox.farX
          );
          const y = RNGManager.nextFloat(
            WorldManager.boundingBox.y,
            WorldManager.boundingBox.farY
          );
          const position = new Vector(x, y);
          const num = RNGManager.next();
          const type =
            num < 0.8 ? (num < 0.6 ? 'Enemy' : 'HomingEnemy') : 'HeavyEnemy';
          const entity = WorldManager.spawnEntity(type);
          if (entity) {
            entity.setPosition(position);
            entity.setColor(randomColor());
          }
        }

        this.info(`Spawning ${count} entities`);
      },
      'Spawns a number of AI units',
      1
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
          const entity = WorldManager.spawnEntity('Feed') as Feed;
          const x =
            RNGManager.next() * WorldManager.boundingBox.width +
            WorldManager.boundingBox.x;
          const y =
            RNGManager.next() * WorldManager.boundingBox.height +
            WorldManager.boundingBox.y;
          const angle = RNGManager.nextFloat(0, 2 * Math.PI);
          const variantNum = RNGManager.next();
          const variant =
            variantNum < 0.1
              ? FeedVariant.Large
              : variantNum < 0.4
              ? FeedVariant.Medium
              : FeedVariant.Small;
          entity.setVariant(variant);
          entity.setPositionXY(x, y);
          entity.angle = angle;
        }

        this.info(`Spawning ${count} entities`);
      },
      'Spawns a number of feed units',
      1
    );

    this.registerCommand(
      'heal',
      (player) => {
        const {hero} = player;
        if (hero) {
          const life = hero.getMaxLife();
          hero.setLife(life);
          this.info(`Healed to ${life} life`, player);
        }
      },
      "Heals the player's hero to maximum life",
      1
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
      'Kills all units',
      1
    );

    this.registerCommand(
      'stop',
      (_player) => {
        this.info('Stopping the server');
        process.kill(process.pid, 'SIGINT');
      },
      'Stops the server',
      1
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
      'Sets the level of the player character',
      1
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
      'Changes the player class',
      1
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

        this.info(`${intervalString},${interval}`);

        TimerManager.setInterval(interval);
      },
      'Sets the server clock interval',
      1
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

        const inner = players.map(({id}) => id).join(', ');
        this.info('Player IDs: ' + inner, player);
      },
      'Looks up the player ID associated with the given name',
      1
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
      'Kicks the player with the specified ID',
      1
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
      'Executes a command from the specified player',
      1
    );

    this.loadCommands();
  }

  public sendComponents(
    components: (string | null | TextComponent)[],
    target: number | Player = -1
  ) {
    const socket = target instanceof Player ? target.socket : target;
    const outEvent = {
      ...makeEvent(TextMessageOutEvent, {components}),
      socket,
    };
    EventManager.emit(outEvent);
    NetworkManager.sendEvent(outEvent, socket);
  }

  public info(message: string, target: number | Player = -1) {
    const components = this.serverMessageFormatter.format({
      color: 'grey',
      kind: 'Info',
      content: message,
    });
    this.sendComponents(components, target);
    log.info('[' + message + ']');
  }

  public warn(message: string, target: number | Player = -1) {
    const components = this.serverMessageFormatter.format({
      color: 'yellow',
      kind: 'Warn',
      content: message,
    });
    this.sendComponents(components, target);
    log.warn('[' + message + ']');
  }

  public error(message: string, target: number | Player = -1) {
    const components = this.serverMessageFormatter.format({
      color: 'red',
      kind: 'Error',
      content: message,
    });
    this.sendComponents(components, target);
    log.error('[' + message + ']');
  }
}

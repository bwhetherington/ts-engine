import {CommandEntry, ChatManager} from 'server/chat';
import {hsv} from 'core/graphics/color';
import {Player, PlayerManager} from 'core/player';
import {loadWorld} from 'server/util';
import {LogManager} from 'core/log';
import {RNGManager} from 'core/random';
import {NetworkManager} from 'core/net';
import {isOk} from 'core/net/http';
import {WorldManager} from 'core/entity';
import {Matrix2} from 'core/geometry';
import { ModifierUpgrade } from 'core/upgrade';

const log = LogManager.forFile(__filename);

export const setColor: CommandEntry = {
  name: 'setcolor',
  help: 'Sets the hue of the player color from 0 to 359',
  handler(player, ...args) {
    if (args.length === 1) {
      const hue = parseInt(args[0]) % 360;
      if (Number.isNaN(hue)) {
        ChatManager.error('Hue choice is invalid', player);
      }

      const color = hsv(hue, 0.65, 0.9);
      const hero = player.hero;
      if (hero) {
        hero.setColor(color);
      }
    } else {
      ChatManager.error('Must specify 1 argument', player);
    }
  },
};

export const loadLevel: CommandEntry = {
  name: 'loadlevel',
  help: 'Loads the specified level.',
  permissionLevel: 1,
  async handler(player, ...args) {
    if (args.length === 1) {
      // Attempt to load the map file
      try {
        await loadWorld(args[0]);
        ChatManager.info(`Set level to: ${args[0]}`);
      } catch (ex) {
        ChatManager.error('Failed to load level', player);
      }
    } else {
      ChatManager.error('Must specify 1 argument');
    }
  },
};

export const saveAll: CommandEntry = {
  name: 'saveall',
  help: 'Saves all players.',
  permissionLevel: 1,
  async handler(player) {
    try {
      const start = Date.now();
      await PlayerManager.saveAll();
      const time = Date.now() - start;
      ChatManager.info(`All players saved (${time} ms)`, player);
    } catch (ex) {
      ChatManager.error('Error saving players', player);
      log.error(ex.message ?? 'Could not load file');
    }
  },
};

export const roll: CommandEntry = {
  name: 'roll',
  help: 'rolls dice',
  permissionLevel: 0,
  async handler(player, ...args) {
    function roll(die: number): void {
      const res = RNGManager.nextInt(1, die + 1);
      ChatManager.info(`${player.name} rolls d${die} => ${res}`);
    }
    if (args.length > 0) {
      for (const arg of args) {
        const die = parseInt(arg);
        roll(die);
      }
    } else {
      roll(20);
    }
  },
};

export const pre: CommandEntry = {
  name: 'pre',
  help: 'preformatted message',
  permissionLevel: 0,
  async handler(player) {
    ChatManager.sendComponents(
      [
        {
          content: JSON.stringify(player.serialize(), null, 2),
          style: {
            pre: true,
          },
        },
      ],
      player
    );
  },
};

export const promote: CommandEntry = {
  name: 'promote',
  help: 'promote the specified account',
  permissionLevel: 2,
  async handler(player, username) {
    if (!username) {
      ChatManager.error('No username specified', player);
      return;
    }

    // Load account
    const res = await NetworkManager.http?.get('/user/' + username);
    if (res && isOk(res.code)) {
      const prevLevel = res.data.permissionLevel ?? 0;
      const newData = {
        username,
        permissionLevel: Math.max(prevLevel, 1),
      };
      const auth = player.getAuth();
      if (auth) {
        const saveRes = await NetworkManager.http?.post(
          '/update',
          newData,
          auth
        );
        if (!(saveRes && isOk(saveRes.code))) {
          ChatManager.error('Could not promote user', player);
        }
      } else {
        ChatManager.error('Must be authenticated', player);
      }
    } else {
      ChatManager.warn(`User '${username}' not found`, player);
    }
  },
};

export const showUser: CommandEntry = {
  name: 'showuser',
  help: "Shows the specified user's ID",
  permissionLevel: 1,
  async handler(player, target) {
    if (!target) {
      return;
    }

    const targetPlayer = PlayerManager.findPlayer(target);
    if (!targetPlayer) {
      return;
    }

    ChatManager.info(
      `${targetPlayer.toString()} ${targetPlayer.hero?.toString()}`,
      player
    );
  },
};

export const checkSize: CommandEntry = {
  name: 'checksize',
  help: 'Shows the size of the current entity pool in bytes',
  permissionLevel: 1,
  async handler(player) {
    const jsonSize = Buffer.from(JSON.stringify(WorldManager.serialize()))
      .byteLength;
    const binSize = WorldManager.dataSerializeAll().toRaw().byteLength;
    ChatManager.info(`json: ${jsonSize}, binary: ${binSize}`, player);
  },
};

export const powerfulShots: CommandEntry = {
  name: 'powerfulshots',
  help: "Increase the player's damage",
  permissionLevel: 1,
  async handler(player) {
    const {hero} = player;
    if (hero) {
      const upgrade = new ModifierUpgrade({
        damage: new Matrix2().fields(1.2, 0),
      });
      upgrade.applyTo(hero);
      ChatManager.info('Powerful Shots unlocked', player);
    }
  },
};

export const rapidFire: CommandEntry = {
  name: 'rapidfire',
  help: "Increase the player's rate of attack",
  permissionLevel: 1,
  async handler(player) {
    const {hero} = player;
    if (hero) {
      const upgrade = new ModifierUpgrade({
        rate: new Matrix2().fields(0.8, 0),
      });
      upgrade.applyTo(hero);
      ChatManager.info('Rapid Fire unlocked', player);
    }
  },
};
export const addShots: CommandEntry = {
  name: 'addshots',
  help: "Adds shots to the player's weapon",
  permissionLevel: 1,
  async handler(player) {
    const {hero} = player;
    if (hero) {
      const upgrade = new ModifierUpgrade({
        damage: new Matrix2().fields(0.5, 0),
        shotCount: new Matrix2().fields(1, 2),
        shotSpread: new Matrix2().fields(1.2, 0),
      });
      upgrade.applyTo(hero);
      ChatManager.info('Multishot unlocked', player);
    }
  },
};

export const fusilage: CommandEntry = {
  name: 'barrage',
  help: "Doubles the number of shots at reduced damage",
  permissionLevel: 1,
  async handler(player) {
    const {hero} = player;
    if (hero) {
      const upgrade = new ModifierUpgrade({
        damage: new Matrix2().fields(0.5, 0),
        shotCount: new Matrix2().fields(2, 1),
        shotSpread: new Matrix2().fields(1.5, 0),
      });
      upgrade.applyTo(hero);
      ChatManager.info('Fusilage unlocked', player);
    }
  },
};

export const focusFire: CommandEntry = {
  name: 'focusfire',
  help: "Tightens the shot spread",
  permissionLevel: 1,
  async handler(player) {
    const {hero} = player;
    if (hero) {
      const upgrade = new ModifierUpgrade({
        shotSpread: new Matrix2().fields(0.6, 0),
      });
      upgrade.applyTo(hero);
      ChatManager.info('Focus Fire unlocked', player);
    }
  },
};

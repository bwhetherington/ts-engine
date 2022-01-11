import {CommandEntry, ChatManager} from 'server/chat';
import {hsv, tryColor} from 'core/graphics/color';
import {PlayerManager} from 'core/player';
import {loadWorld} from 'server/util';
import {LogManager} from 'core/log';
import {RNGManager} from 'core/random';
import {NetworkManager} from 'core/net';
import {isOk} from 'core/net/http';

const log = LogManager.forFile(__filename);

export const setColor: CommandEntry = {
  name: 'setcolor',
  help: 'Sets the hue of the player color from 0 to 359',
  handler(player, ...args) {
    if (args.length === 1) {
      const color = tryColor(args[0]);

      const hero = player.hero;
      if (hero && color) {
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
    } catch (ex: any) {
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
    function roll(die: number) {
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

export const immune: CommandEntry = {
  name: 'immune',
  help: 'Toggles immunity on your hero',
  permissionLevel: 1,
  async handler(player) {
    const {hero} = player;
    if (!hero) {
      return;
    }
    hero.setIsImmune(!hero.getIsImmune());
    if (hero.getIsImmune()) {
      ChatManager.info('You are now immune', player);
    } else {
      ChatManager.info('You are no longer immune', player);
    }
  },
};

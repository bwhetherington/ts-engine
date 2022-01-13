import {CommandEntry, ChatManager} from '@/server/chat';
import {PlayerManager} from '@/core/player';
import {loadWorld} from '@/server/util';
import {NetworkManager} from '@/core/net';
import {isOk} from '@/core/net/http';

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
      `${targetPlayer.toString()} ${
        targetPlayer.hero?.toString() ?? 'undefined'
      }`,
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

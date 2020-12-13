import { CommandEntry, ChatManager } from 'server/chat';
import { hsv } from 'core/graphics/color';
import { Player, PlayerManager } from 'core/player';
import { loadWorld } from 'server/util';
import { LogManager } from 'core/log';
import { RNGManager } from 'core/random';

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
      ChatManager.info(JSON.stringify(color));
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
      ChatManager.info('Saving players');
      await PlayerManager.saveAll();
      ChatManager.info('All players saved', player);
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
      ChatManager.info(`d${die} => ${res}`, player);
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
    ChatManager.sendComponents([
      {
        content: JSON.stringify(player.serialize(), null, 2),
        style: {
          pre: true
        }
      }
    ], player);
  }
}

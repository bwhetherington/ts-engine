import { CommandEntry, ChatManager } from 'server/chat';
import { hsv } from 'core/graphics/color';
import { readFile } from 'fs/promises';
import { WorldManager } from 'core/entity';
import { PlayerManager } from 'core/player';
import { loadWorld } from 'server/util';
import { AssetManager } from 'core/assets';

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
        console.error(ex);
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
    }
  },
};

export const roll: CommandEntry = {
  name: 'roll',
  help: 'rolls dice',
  permissionLevel: 0,
  async handler(player) {},
};

export const pre: CommandEntry = {
  name: 'pre',
  help: 'preformatted message',
  permissionLevel: 0,
  async handler(player) {
    const world = await AssetManager.loadJSON('assets/worlds/open.json');
    const content = JSON.stringify(player.serialize(), null, 2);
    ChatManager.sendComponents([
      'Player',
      {
        content: JSON.stringify(player.serialize(), null, 2),
        style: {
          pre: true
        }
      },
      'Hero',
      {
        content: JSON.stringify(player.hero?.serialize() ?? {}, null, 2),
        style: {
          pre: true
        }
      },
      'World',
      {
        content: JSON.stringify(WorldManager.serialize(), null, 2),
        style: {
          pre: true
        }
      }
    ], player);
  }
}

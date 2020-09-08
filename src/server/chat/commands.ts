import { CommandEntry, ChatManager } from 'server/chat';
import { hsv } from 'core/graphics/color';

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
    }
  },
};

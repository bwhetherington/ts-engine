import {BaseHero, LevelUpEvent, WorldManager} from '@/core/entity';
import {UpgradeManager} from '@/core/upgrade';

import {Server} from '@/server/net';
import {Plugin} from '@/server/plugin';

export class UpgradePlugin extends Plugin {
  public static typeName: string = 'UpgradePlugin';

  public async initialize(server: Server): Promise<void> {
    await super.initialize(server);

    this.streamEvents(LevelUpEvent)
      .filter(({data: {from, to}}) => to > from)
      .filterMap(({data: {from, to, id}}) => {
        const entity = WorldManager.getEntity(id);
        if (!(entity instanceof BaseHero)) {
          return;
        }

        const player = entity.getPlayer();
        if (!player) {
          return;
        }

        const hero = entity;

        return {from, to, player, hero};
      })
      .forEach(({hero}) => {
        hero.storedUpgrades += 1;
      });

    this.registerCommand({
      name: 'upgrade',
      help: 'Adds an upgrade to the hero',
      async handler(player, arg) {
        const hero = player.hero;
        if (!hero) {
          return;
        }
        if (arg) {
          const upgrade = UpgradeManager.instantiate(arg);
          if (upgrade) {
            hero.applyUpgrade(upgrade);
          }
        } else {
          hero.storedUpgrades += 1;
        }
      },
    });
  }
}

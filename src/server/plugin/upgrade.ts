import {LevelUpEvent, BaseHero, WorldManager} from '@/core/entity';
import {UpgradeEvent, UpgradeManager} from '@/core/upgrade';
import {ChatManager} from '@/server/chat';

import {Server} from '@/server/net';
import {Plugin} from '@/server/plugin';

export class UpgradePlugin extends Plugin {
  public static typeName: string = 'UpgradePlugin';

  public async initialize(server: Server): Promise<void> {
    await super.initialize(server);

    this.streamEvents<LevelUpEvent>('LevelUpEvent')
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

    // this.streamEvents<UpgradeEvent>('UpgradeEvent').forEach(
    //   ({data: {hero, upgrade}}) => {
    //     const player = hero.getPlayer();
    //     if (!player) {
    //       return;
    //     }
    //     ChatManager.info(`Upgrade selected: ${upgrade.name}`, player);
    //   }
    // );

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

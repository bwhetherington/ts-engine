import {LevelUpEvent, BaseHero, WorldManager} from 'core/entity';
import { RNGManager } from 'core/random';
import {UpgradeEvent, UpgradeManager} from 'core/upgrade';
import { ChatManager } from 'server/chat';

import {Server} from 'server/net';
import {Plugin} from 'server/plugin';

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

        return {from, to, player};
      })
      .forEach(({to, player}) => {
        let upgrades;
        if (to === 5) {
          // Offer a hero upgrade at level 5
          upgrades = UpgradeManager.sampleHeroUpgrades().take(2).toArray();
        } else {
          upgrades = UpgradeManager.sampleUpgrades().take(3).toArray();
        }
        UpgradeManager.offerUpgrades(player, upgrades);
      });

    this.streamEvents<UpgradeEvent>('UpgradeEvent')
      .forEach(({data: {hero, upgrade}}) => {
        const player = hero.getPlayer();
        if (!player) {
          return;
        }
        ChatManager.info(`Upgrade selected: ${upgrade.name}`, player);
      });
  }
}

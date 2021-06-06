import {LevelUpEvent, BaseHero, WorldManager} from 'core/entity';
import {UpgradeManager} from 'core/upgrade';

import {Server} from 'server/net';
import {Plugin} from 'server/plugin';

export class UpgradePlugin extends Plugin {
  public static typeName: string = 'UpgradePlugin';

  public async initialize(server: Server): Promise<void> {
    await super.initialize(server);

    this.streamEvents<LevelUpEvent>('LevelUpEvent')
      .filter(({data: {from, to}}) => to > from)
      .filterMap(({data: {id}}) => {
        const entity = WorldManager.getEntity(id);
        if (entity instanceof BaseHero) {
          return entity.getPlayer();
        }
      })
      .forEach((player) => {
        const upgrades = UpgradeManager.sampleUpgrades().take(3).toArray();
        UpgradeManager.offerUpgrades(player, upgrades);
      });
  }
}

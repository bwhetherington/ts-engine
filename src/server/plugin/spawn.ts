import {WorldManager} from 'core/entity';
import {Vector} from 'core/geometry';
import {Iterator} from 'core/iterator';
import {Player} from 'core/player';

import {ChatManager} from 'server/chat';
import {Server} from 'server/net';
import {Plugin} from 'server/plugin';

export class SpawnPlugin extends Plugin {
  public static typeName: string = 'SpawnPlugin';

  private spawn(player: Player, type: string, count: number) {
    if (!WorldManager.canInstantiate(type)) {
      ChatManager.error(`Cannot spawn type '${type}'`, player);
      return;
    }
    const loc = new Vector(0, 0);
    Iterator.range(0, count ?? 1).forEach(() => {
      WorldManager.spawnEntity(type, loc);
    });
  }

  public async initialize(server: Server): Promise<void> {
    this.registerCommand({
      name: 'spawn',
      help: 'Spawns some number of entities at the center of the map',
      handler: (player, type, count) => {
        if (!type) {
          ChatManager.error('Must specify a type of entity to spawn', player);
        }

        let entityCount = 0;
        if (count) {
          const countNumber = parseInt(count);
          if (Number.isNaN(countNumber)) {
            ChatManager.error(`'${count}' is not a valid number`, player);
          }
          entityCount = countNumber;
        }

        this.spawn(player, type, entityCount);
      },
    });
    await super.initialize(server);
  }
}

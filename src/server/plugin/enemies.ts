import {WorldManager} from 'core/entity';
import {EventManager} from 'core/event';
import {Server} from 'server/net';
import {Plugin} from 'server/plugin';
import {randomColor} from 'core/graphics/color';
import {RNGManager} from 'core/random';

export class EnemiesPlugin extends Plugin {
  public constructor() {
    super();
    this.type = 'EnemyPlugin';
  }

  public async initialize(server: Server): Promise<void> {
    this.streamInterval(5)
      .filter(() => WorldManager.getUnitCount() < 30)
      .forEach(() => {
        // Create enemy
        const position = WorldManager.getRandomPosition();

        const type = RNGManager.nextEntry([
          'Enemy',
          'Enemy',
          'Enemy',
          'HomingEnemy',
          'HomingEnemy',
          'HeavyEnemy',
        ]);
        const enemy = WorldManager.spawnEntity(type, position);

        // Pick color
        enemy.setColor(randomColor());
      });
    await super.initialize(server);
  }
}

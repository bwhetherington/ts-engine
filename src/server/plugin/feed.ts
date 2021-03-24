import {Feed, FeedVariant, WorldManager} from 'core/entity';
import {EventManager} from 'core/event';
import {Server} from 'server/net';
import {Plugin} from 'server/plugin';
import {randomColor} from 'core/graphics/color';
import {RNGManager} from 'core/random';

export class FeedPlugin extends Plugin {
  public constructor() {
    super();
    this.type = 'FeedPlugin';
  }

  public async initialize(server: Server): Promise<void> {
    this.streamInterval(5)
      .filter(() => WorldManager.getUnitCount() < 30)
      .forEach(() => {
        const num = RNGManager.nextFloat(0, 1);
        const position = WorldManager.getRandomPosition();
        let size;
        if (num < 0.2) {
          size = FeedVariant.Large;
        } else if (num < 0.5) {
          size = FeedVariant.Medium;
        } else {
          size = FeedVariant.Small;
        }
        const entity = WorldManager.spawnEntity('Feed', position) as Feed;
        entity.setVariant(size);
      });
    await super.initialize(server);
  }
}

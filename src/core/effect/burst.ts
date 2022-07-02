import {Effect} from '@/core/effect';
import {Explosion, WorldManager} from '@/core/entity';
import {FireEvent} from '@/core/weapon';

export class BaseBurstEffect extends Effect {
  public static typeName: string = 'BaseBurstEffect';

  public override onStart() {
    this.streamEvents<FireEvent>('FireEvent')
      .filter((event) => event.data.sourceID === this.target?.id)
      .filterMap(() => this.target)
      .takeEachN(5)
      .forEach((source) => {
        // Do something
        const explosion = WorldManager.spawnEntity(
          'Explosion',
          source.position
        ) as Explosion;
        explosion.parent = source;
        explosion.duration = 1;
        explosion.radius = 500;
        explosion.damage = 50;
        explosion.pierce = 100;
      });
  }
}

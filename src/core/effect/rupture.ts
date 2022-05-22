import {Effect} from '@/core/effect';
import {Explosion, KillEvent, Unit, WorldManager} from '@/core/entity';

export class RuptureEffect extends Effect {
  public static typeName: string = 'RuptureEffect';

  public override onStart() {
    this.streamEvents<KillEvent>('KillEvent')
      .filter((event) => event.data.sourceID === this.target?.id)
      .filterMap((event) => {
        const target = WorldManager.getEntity(event.data.targetID);
        if (target instanceof Unit) {
          return target;
        }
      })
      .filter((target) => target.getXPWorth() > 0)
      .forEach((target) => {
        const explosion = WorldManager.spawnEntity('Explosion', target.position) as Explosion;
        explosion.parent = this.target;
        explosion.duration = 1.5;
        explosion.radius = target.boundingBox.width * 5;
        explosion.damage = target.getMaxLife() * 3;
        explosion.pierce = 100;
      });
  }
}

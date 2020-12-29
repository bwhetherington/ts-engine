import {
  HomingProjectile,
  KillEvent,
  Projectile,
  Tank,
  Unit,
  WorldManager,
} from 'core/entity';
import {Rectangle} from 'core/geometry';
import {BaseGun} from 'core/weapon';

export class BaseHomingGun extends BaseGun {
  public static typeName: string = 'BaseHomingGun';

  public constructor() {
    super();
    this.type = BaseHomingGun.typeName;
    this.projectileType = HomingProjectile.typeName;
    this.projectileSpeed = 350;
    this.rate = 0.35;
    this.projectileSpread = 0.5;
    this.projectilePierce = 1;
  }

  private selectTarget(
    projectile: HomingProjectile,
    source: Tank
  ): Unit | undefined {
    const range = this.projectileSpeed * projectile.duration;
    const [target] = WorldManager
      .query(
        new Rectangle(
          range * 2,
          range * 2,
          source.position.x - range,
          source.position.y - range
        )
      )
      .filter((entity) => entity.position.distanceTo(source.position) < range)
      .filter((entity) => !(source === entity || projectile === entity))
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .filter((unit) => unit.isAlive)
      .map<[Unit | undefined, number]>((unit) => [
        unit,
        unit.position.distanceTo(projectile.position),
      ])
      .fold(
        [undefined as Unit | undefined, Number.POSITIVE_INFINITY],
        (min, cur) => (cur[1] < min[1] ? cur : min)
      );
    return target;
  }

  protected createProjectile(source: Tank, angle: number): Projectile {
    const base = super.createProjectile(source, angle) as HomingProjectile;
    base.turnSpeed = this.projectileSpeed / 10;
    base.maxSpeed = this.projectileSpeed;
    base.target = this.selectTarget(base, source);
    base.shape = 'triangle';

    base
      .streamEvents<KillEvent>('KillEvent')
      .filter((event) => event.data.targetID === base.target?.id)
      .forEach(() => {
        base.target = this.selectTarget(base, source);
      });

    base.duration = 3;
    return base;
  }
}

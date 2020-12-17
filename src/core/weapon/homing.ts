import {
  HomingProjectile,
  KillEvent,
  Projectile,
  Tank,
  Unit,
  WorldManager,
} from 'core/entity';
import { Gun } from 'core/weapon';

export class HomingGun extends Gun {
  public static typeName: string = 'HomingGun';

  public constructor() {
    super();
    this.type = HomingGun.typeName;
    this.projectileType = HomingProjectile.typeName;
    this.projectileSpeed = 300;
    this.rate = 0.15;
    this.projectileSpread = 1;
    this.projectilePierce = 1;
  }

  private selectTarget(
    projectile: HomingProjectile,
    source: Tank
  ): Unit | undefined {
    const [target] = WorldManager.getEntities()
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
    base.turnSpeed = this.projectileSpeed / 5;
    base.maxSpeed = this.projectileSpeed;
    base.target = this.selectTarget(base, source);

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

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
  }

  protected createProjectile(source: Tank, angle: number): Projectile {
    const base = super.createProjectile(source, angle) as HomingProjectile;
    base.turnSpeed = this.projectileSpeed / 10;
    base.maxSpeed = this.projectileSpeed;
    base.shape = 'triangle';
    return base;
  }
}

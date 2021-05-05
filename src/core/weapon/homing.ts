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
import {HeroModifier} from '../upgrade/modifier';

export class BaseHomingGun extends BaseGun {
  public static typeName: string = 'BaseHomingGun';

  public constructor() {
    super();
    this.type = BaseHomingGun.typeName;
    this.projectileType = HomingProjectile.typeName;
  }

  protected createProjectile(
    source: Tank,
    angle: number,
    modifier?: HeroModifier
  ): Projectile {
    const base = super.createProjectile(
      source,
      angle,
      modifier
    ) as HomingProjectile;
    base.turnSpeed = this.projectileSpeed / 5;
    base.maxSpeed = this.projectileSpeed;
    base.shape = 'triangle';
    return base;
  }
}

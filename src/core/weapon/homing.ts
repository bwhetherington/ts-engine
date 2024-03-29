import {HomingProjectile, Projectile, Tank} from '@/core/entity';
import {BaseGun} from '@/core/weapon';
import {HeroModifier} from '@/core/upgrade';

export class BaseHomingGun extends BaseGun {
  public static typeName: string = 'BaseHomingGun';

  public constructor() {
    super();
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

import {Weapon} from '@/core/weapon';
import {
  WorldManager,
  Projectile,
  Tank,
  ProjectileShape,
  isProjectileShape,
} from '@/core/entity';
import {Data} from '@/core/serialize';
import {HeroModifier} from '../upgrade/modifier';
import {AssetIdentifier, isAssetIdentifier} from '@/core/assets';

export class BaseGun extends Weapon {
  public static typeName: string = 'BaseGun';

  protected projectileType: AssetIdentifier = 'Projectile';
  protected projectileShape: ProjectileShape = 'circle';
  protected projectileSpeed: number = 500;
  protected projectileDuration: number = 1;

  public constructor() {
    super();
    this.rate = 0.35;
    this.damage = 5;
  }

  protected createProjectile(
    source: Tank,
    angle: number,
    modifier?: HeroModifier
  ): Projectile {
    let {pierce, projectileSpeed, projectileDuration} = this;

    if (modifier) {
      pierce = modifier.get('pierce') - 1 + pierce;
      projectileSpeed = modifier.get('projectileSpeed') * projectileSpeed;
      projectileDuration =
        modifier.get('projectileDuration') * projectileDuration;
    }

    const projectile = WorldManager.spawnEntity(
      this.projectileType
    ) as Projectile;
    projectile.setPosition(source.getCannonTip());
    projectile.setColor(source.getBaseColor());
    projectile.parent = source;
    projectile.damage = this.rollDamage(source);
    projectile.pierce = pierce;
    projectile.velocity.setXY(1, 0);
    projectile.velocity.angle = angle;
    projectile.angle = projectile.velocity.angle;
    projectile.velocity.magnitude = projectileSpeed;
    projectile.shape = this.projectileShape;
    projectile.duration = projectileDuration;
    projectile.onHit = this.onHit.bind(this, source);

    return projectile;
  }

  public fire(source: Tank, angle: number, modifier?: HeroModifier) {
    const projectile = this.createProjectile(source, angle, modifier);
    source.applyForce(projectile.velocity, -projectile.mass / 20);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      projectileType: this.projectileType,
      projectileSpeed: this.projectileSpeed,
      projectileShape: this.projectileShape,
      projectileDuration: this.projectileDuration,
    };
  }

  public deserialize(data: Data) {
    super.deserialize(data);
    const {
      projectileType,
      projectileSpeed,
      projectileShape,
      projectileDuration,
    } = data;

    if (isAssetIdentifier(projectileType)) {
      this.projectileType = projectileType;
    }

    if (typeof projectileSpeed === 'number') {
      this.projectileSpeed = projectileSpeed;
    }

    if (typeof projectileDuration === 'number') {
      this.projectileDuration = projectileDuration;
    }

    if (isProjectileShape(projectileShape)) {
      this.projectileShape = projectileShape;
    }
  }
}

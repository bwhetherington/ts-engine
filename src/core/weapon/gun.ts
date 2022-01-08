import {Weapon} from 'core/weapon';
import {
  WorldManager,
  Projectile,
  Tank,
  ProjectileShape,
  isProjectileShape,
  Trail,
  Aura,
} from 'core/entity';
import {Data} from 'core/serialize';
import {RNGManager} from 'core/random';
import {HeroModifier} from '../upgrade/modifier';
import {DotEffect} from 'core/effect';
import {AssetIdentifier, isAssetIdentifier} from 'core/assets';

export class BaseGun extends Weapon {
  public static typeName: string = 'BaseGun';

  protected projectileType: AssetIdentifier = 'Projectile';
  protected projectileShape: ProjectileShape = 'circle';
  protected projectileSpeed: number = 500;
  protected projectileSpread: number = 0.1;
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
    let {pierce, projectileSpread, projectileSpeed, projectileDuration} = this;

    if (modifier) {
      pierce = modifier.get('pierce') - 1 + pierce;
      projectileSpread = modifier.get('projectileSpread') * projectileSpread;
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
    projectile.damage = this.rollDamage(modifier);
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
      projectileSpread: this.projectileSpread,
      projectileShape: this.projectileShape,
      projectileDuration: this.projectileDuration,
    };
  }

  public deserialize(data: Data) {
    super.deserialize(data);
    const {
      projectileType,
      projectileSpeed,
      projectileSpread,
      projectileShape,
      projectileDuration,
    } = data;

    if (isAssetIdentifier(projectileType)) {
      this.projectileType = projectileType;
    }

    if (typeof projectileSpeed === 'number') {
      this.projectileSpeed = projectileSpeed;
    }

    if (typeof projectileSpread === 'number') {
      this.projectileSpread = projectileSpread;
    }

    if (typeof projectileDuration === 'number') {
      this.projectileDuration = projectileDuration;
    }

    if (isProjectileShape(projectileShape)) {
      this.projectileShape = projectileShape;
    }
  }
}

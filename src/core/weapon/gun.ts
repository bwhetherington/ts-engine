import {Weapon} from 'core/weapon';
import {
  WorldManager,
  Projectile,
  Tank,
  ProjectileShape,
  isProjectileShape,
} from 'core/entity';
import {Data} from 'core/serialize';
import {RNGManager} from 'core/random';

export class BaseGun extends Weapon {
  public static typeName: string = 'BaseGun';

  protected projectileType: string = 'Projectile';
  protected projectileShape: ProjectileShape = 'circle';
  protected projectileSpeed: number = 500;
  protected projectileSpread: number = 0.1;
  protected projectilePierce: number = 1;

  public constructor() {
    super();
    this.type = BaseGun.typeName;
    this.rate = 0.35;
    this.damage = 5;
  }

  protected createProjectile(source: Tank, angle: number): Projectile {
    const projectile = WorldManager.spawnEntity(
      this.projectileType,
      source.getCannonTip()
    ) as Projectile;
    projectile.setColor(source.getBaseColor());
    projectile.parent = source;
    projectile.bounce = 0;
    projectile.damage = this.rollDamage();
    projectile.pierce = this.projectilePierce;
    projectile.velocity.setXY(1, 0);
    const offset = RNGManager.nextFloat(-0.5, 0.5) * this.projectileSpread;
    projectile.velocity.angle = angle + offset;
    projectile.angle = projectile.velocity.angle;
    projectile.velocity.magnitude = this.projectileSpeed;
    projectile.shape = this.projectileShape;
    return projectile;
  }

  public fire(source: Tank, angle: number): void {
    const projectile = this.createProjectile(source, angle);
    source.applyForce(projectile.velocity, -projectile.mass);
  }

  // foo
  public serialize(): Data {
    return {
      ...super.serialize(),
      projectileType: this.projectileType,
      projectileSpeed: this.projectileSpeed,
      projectileSpread: this.projectileSpread,
      projectilePierce: this.projectilePierce,
      projectileShape: this.projectileShape,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {
      projectileType,
      projectileSpeed,
      projectileSpread,
      projectilePierce,
      projectileShape,
    } = data;

    if (typeof projectileType === 'string') {
      this.projectileType = projectileType;
    }

    if (typeof projectileSpeed === 'number') {
      this.projectileSpeed = projectileSpeed;
    }

    if (typeof projectileSpread === 'number') {
      this.projectileSpread = projectileSpread;
    }

    if (typeof projectilePierce === 'number') {
      this.projectilePierce = projectilePierce;
    }

    if (isProjectileShape(projectileShape)) {
      this.projectileShape = projectileShape;
    }
  }
}

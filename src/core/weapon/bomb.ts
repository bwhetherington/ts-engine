import { Weapon } from 'core/weapon';
import { Tank, WorldManager, Projectile } from 'core/entity';

export class Bomb extends Weapon {
  public static typeName: string = 'Bomb';

  public constructor() {
    super();
    this.type = Bomb.typeName;
    this.rate = 0.8;
    this.damage = 5;
  }

  public fire(source: Tank, angle: number): void {
    const projectile = WorldManager.spawnEntity(
      'BigProjectile',
      source.getCannonTip()
    ) as Projectile;
    projectile.parent = source;
    projectile.damage = this.damage;
    projectile.mass = 1;
    projectile.velocity.setXY(1, 0);
    const offset = (Math.random() - 0.5) * 0.1;
    projectile.velocity.angle = angle + offset;
    projectile.velocity.magnitude = 350;

    source.applyForce(projectile.velocity, -projectile.mass);
  }
}

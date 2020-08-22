import { Weapon } from 'core/weapon';
import { Tank, WorldManager, BombProjectile } from 'core/entity';

export class Bomb extends Weapon {
  public static typeName: string = 'Bomb';

  public constructor() {
    super();
    this.type = Bomb.typeName;
    this.rate = 0.15;
    this.damage = 5;
  }

  public fire(source: Tank, angle: number): void {
    const projectile = WorldManager.spawn(
      BombProjectile,
      source.getCannonTip()
    );

    projectile.parent = source;
    projectile.bounce = 0;
    projectile.damage = this.damage;
    projectile.mass = 1;
    projectile.velocity.setXY(1, 0);
    const offset = (Math.random() - 0.5) * 0.1;
    projectile.velocity.angle = angle + offset;
    projectile.velocity.magnitude = 350;

    source.applyForce(projectile.velocity, -projectile.mass);
  }
}

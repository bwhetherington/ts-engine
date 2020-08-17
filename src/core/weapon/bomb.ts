import { Weapon } from 'core/weapon';
import { Unit, WorldManager, BombProjectile } from 'core/entity';

export class Bomb extends Weapon {
  public static typeName: string = 'Bomb';

  public constructor() {
    super();
    this.type = Bomb.typeName;
    this.rate = 0.15;
    this.damage = 1;
  }

  public fire(source: Unit, angle: number): void {
    const projectile = WorldManager.spawn(BombProjectile, source.position);

    projectile.parent = source;
    projectile.bounce = 0;
    projectile.damage = this.damage;
    projectile.mass = 0.1;
    projectile.velocity.setXY(1, 0);
    const offset = (Math.random() - 0.5) * 0.1;
    projectile.velocity.angle = angle + offset;
    projectile.position.add(projectile.velocity, 10);
    projectile.velocity.magnitude = 550;

    source.applyForce(projectile.velocity, -projectile.mass);
  }
}

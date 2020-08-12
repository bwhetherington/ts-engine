import { Weapon } from 'core/weapon';
import { Unit, WM, Projectile } from 'core/entity';

export class Pistol extends Weapon {
  public static typeName: string = 'Pistol';

  public constructor() {
    super();
    this.type = Pistol.typeName;
    this.rate = 0.15;
  }

  public fire(source: Unit, angle: number): void {
    const projectile = WM.spawn(Projectile, source.position);
    projectile.parent = source;
    projectile.bounce = 0;
    projectile.damage = 8;
    projectile.mass = 0.02;
    projectile.velocity.setXY(1, 0);
    const offset = (Math.random() - 0.5) * 0.1;
    projectile.velocity.angle = angle + offset;
    projectile.position.add(projectile.velocity, 10);
    projectile.velocity.magnitude = 1200;
    source.applyForce(projectile.velocity, -projectile.mass);
  }
}

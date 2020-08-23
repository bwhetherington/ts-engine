import { Weapon } from 'core/weapon';
import { Unit, WorldManager, Projectile, Tank } from 'core/entity';

export class Pistol extends Weapon {
  public static typeName: string = 'Pistol';

  public constructor() {
    super();
    this.type = Pistol.typeName;
    this.rate = 0.35;
    this.damage = 3;
  }

  public fire(source: Tank, angle: number): void {
    const projectile = WorldManager.spawn(Projectile, source.getCannonTip());
    projectile.parent = source;
    projectile.bounce = 0;
    projectile.damage = this.damage;
    projectile.mass = 0.1;
    projectile.velocity.setXY(1, 0);
    const offset = (Math.random() - 0.5) * 0.1;
    projectile.velocity.angle = angle + offset;
    projectile.velocity.magnitude = 550;
    source.applyForce(projectile.velocity, -projectile.mass);
  }
}

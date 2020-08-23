import { Weapon } from 'core/weapon';
import { WorldManager, Projectile, Tank } from 'core/entity';

export class MachineGun extends Weapon {
  public static typeName: string = 'MachineGun';

  public constructor() {
    super();
    this.type = MachineGun.typeName;
    this.rate = 0.2;
    this.damage = 2;
  }

  public fire(source: Tank, angle: number): void {
    const projectile = WorldManager.spawn(Projectile, source.getCannonTip());
    projectile.parent = source;
    projectile.bounce = 0;
    projectile.damage = this.damage;
    projectile.mass = 0.05;
    projectile.velocity.setXY(1, 0);
    const offset = (Math.random() - 0.5) * 0.5;
    projectile.velocity.angle = angle + offset;
    projectile.velocity.magnitude = 450;
    source.applyForce(projectile.velocity, -projectile.mass);
  }
}

import { Weapon } from 'core/weapon';
import { Unit, WM, Projectile } from 'core/entity';

export class Pistol extends Weapon {
  public static typeName: string = 'Pistol';

  public constructor() {
    super();
    this.type = Pistol.typeName;
  }

  public fire(source: Unit, tx: number, ty: number): void {
    const projectile = WM.spawn(Projectile, source.position);
    projectile.parent = source;
    projectile.damage = 25;
    projectile.velocity.setXY(tx, ty);
    projectile.velocity.add(source.position, -1);
    projectile.velocity.normalize();
    projectile.position.add(projectile.velocity, 5);
    projectile.velocity.scale(650);
  }
}

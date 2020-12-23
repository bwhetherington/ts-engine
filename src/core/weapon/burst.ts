import {Tank} from 'core/entity';
import {EventManager} from 'core/event';
import {Gun} from 'core/weapon';

export class BurstGun extends Gun {
  public static typeName: string = 'BurstGun';

  public constructor() {
    super();
    this.type = BurstGun.typeName;
    this.rate = 0.6;
    this.projectileSpread = 0.35;
    this.shotSpread = 0.1;
    this.shots = 2;
    this.damage = 1;
  }

  public async fire(source: Tank, angle: number): Promise<void> {
    for (let i = 0; i < 3; i++) {
      const projectile = this.createProjectile(source, angle);
      projectile.boundingBox.width = 15;
      projectile.boundingBox.height = 15;
      projectile.duration = 0.5;
      source.applyForce(projectile.velocity, -projectile.mass);
      await EventManager.sleep(0.03);
    }
  }
}

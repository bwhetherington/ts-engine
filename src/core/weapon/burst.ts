import {Tank} from 'core/entity';
import {EventManager} from 'core/event';
import {Data} from 'core/serialize';
import {BaseGun} from 'core/weapon';

export class BaseBurstGun extends BaseGun {
  public static typeName: string = 'BaseBurstGun';

  private burstCount: number = 3;
  private burstInterval: number = 0.06;

  public constructor() {
    super();
    this.type = BaseBurstGun.typeName;
    this.rate = 0.6;
    this.projectileSpread = 0.05;
    this.damage = 3;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      burstCount: this.burstCount,
      burstInterval: this.burstInterval,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {burstCount, burstInterval} = data;
    if (typeof burstCount === 'number') {
      this.burstCount = burstCount;
    }
    if (typeof burstInterval === 'number') {
      this.burstInterval = burstInterval;
    }
  }

  public async fire(source: Tank, angle: number): Promise<void> {
    for (let i = 0; i < this.burstCount; i++) {
      const projectile = this.createProjectile(source, angle);
      projectile.boundingBox.width = 15;
      projectile.boundingBox.height = 15;
      source.applyForce(projectile.velocity, -projectile.mass);
      await EventManager.sleep(this.burstInterval);
    }
  }
}

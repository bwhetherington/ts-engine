import {Projectile, WorldManager, Unit} from '@/core/entity';
import {NetworkManager} from '@/core/net';
import {RNGManager} from '@/core/random';
import {Data} from '@/core/serialize';

export class ShatterProjectile extends Projectile {
  public static typeName: string = 'ShatterProjectile';

  public fragCount: number = 3;

  public constructor() {
    super();
    this.type = ShatterProjectile.typeName;
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      fragCount: this.fragCount,
    };
  }

  public override deserialize(data: Data) {
    super.deserialize(data);

    const {fragCount} = data;

    if (typeof fragCount === 'number') {
      this.fragCount = fragCount;
    }
  }

  public override step(dt: number) {
    super.step(dt);

    if (this.velocity.magnitudeSquared > 0) {
      this.angle = this.velocity.angle;
    }
  }

  protected override onHitInternal(target?: Unit) {
    if (NetworkManager.isServer()) {
      for (let i = 0; i < this.fragCount; i++) {
        const fragment = WorldManager.spawn(Projectile, this.position);
        if (!fragment) {
          continue;
        }
        fragment.boundingBox.width = this.boundingBox.width / 2;
        fragment.boundingBox.height = this.boundingBox.height / 2;
        fragment.parent = this.parent;
        fragment.showExplosion = false;

        fragment.mass = this.mass / 4;
        fragment.damage = this.damage / 4;
        fragment.duration = this.duration / 4;
        fragment.friction = this.friction * 4;

        if (target) {
          fragment.ignoreEntities.add(target.id);
        }

        const offset = (RNGManager.nextFloat(0, Math.PI) - Math.PI / 2) / 2;
        fragment.velocity.setXY(1, 0);
        fragment.velocity.magnitude = 500;
        fragment.velocity.angle = this.angle + offset;
      }
    }
  }
}

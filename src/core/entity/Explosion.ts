import {CollisionLayer, Projectile, Unit, WorldManager} from '@/core/entity';
import {EventManager} from '@/core/event';
import {GraphicsContext} from '@/core/graphics';
import {clamp, smoothStep} from '@/core/util';
import {Data} from '../serialize';
import {Iterator} from '@/core/iterator';
import {NetworkManager} from '../net';

const SHOCKWAVE_WIdTH = 30;

export class Explosion extends Projectile {
  public static typeName: string = 'Explosion';

  public radius: number = 20;

  public constructor() {
    super();
    this.type = Explosion.typeName;
    this.collisionLayer = CollisionLayer.Aura;
    this.showExplosion = false;
    this.isCollidable = false;
  }

  protected override hasTrail(): boolean {
    return false;
  }

  private getEndTime(): number {
    return this.timeCreated + this.duration;
  }

  private updateBoundingBoxSize(radius: number) {
    this.boundingBox.width = radius * 2;
    this.boundingBox.height = radius * 2;
  }

  public override step(dt: number) {
    super.step(dt);
    const t = this.getParameter();
    const radius = Math.max(1, t * this.radius);
    this.updateBoundingBoxSize(radius);

    if (NetworkManager.isServer()) {
      for (const target of this.getTargets()) {
        this.hit(target);
      }
    }
  }

  private getParameter(): number {
    const end = this.getEndTime();
    const progress = clamp(
      (end - EventManager.timeElapsed) / this.duration,
      0,
      1
    );
    const t = smoothStep(progress);
    return 1 - t;
  }

  private getTargets(): Iterator<Unit> {
    return (
      WorldManager.query(this.boundingBox)
        .filterMap((entity) => (entity instanceof Unit ? entity : undefined))

        // Ignore entities that we have already hit or that we are ignoring
        .filter(
          (unit) =>
            !(this.hitEntities.has(unit.id) || this.ignoreEntities.has(unit.id))
        )

        // Ignore non-hostile units
        .filter((unit) => {
          return !this.parent || this.parent.isHostileTo(unit);
        })

        // Ignore units outside of the circle
        .filter((unit) => {
          // Verify that they are within the radius
          const unitRadius = unit.boundingBox.width / 2;
          const fullRadius = this.boundingBox.width / 2 + unitRadius;
          if (
            unit.position.distanceToXYSquared(
              this.position.x,
              this.position.y
            ) >
            fullRadius * fullRadius
          ) {
            return false;
          }

          return true;
        })
    );
  }

  public override render(ctx: GraphicsContext) {
    const radius = this.boundingBox.width / 2;
    const color = {
      ...this.getColor(),
      alpha: Math.max(0, 0.8 - this.getParameter()),
    };
    const center = {...color, alpha: 0};
    ctx.gradientCircle(
      0,
      0,
      Math.max(radius - SHOCKWAVE_WIdTH, 0),
      radius,
      center,
      color
    );
  }

  public override shouldDeleteIfOffscreen(): boolean {
    return true;
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      radius: this.radius,
    };
  }

  public override deserialize(data: Data): void {
    super.deserialize(data);
    const {radius} = data;
    if (typeof radius === 'number') {
      this.radius = radius;
    }
  }
}

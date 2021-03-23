import {Entity, CollisionLayer} from 'core/entity';
import {sleep} from 'core/util';
import {StepEvent} from 'core/event';
import {GraphicsContext} from 'core/graphics';

function explodeFunction(t: number): number {
  // `t` is the time remaining in [0..1]
  t = 1 - t;
  return (t + 1) / 2;
}

const DURATION = 0.3;

export class Explosion extends Entity {
  public static typeName: string = 'Explosion';

  public radius: number = 20;

  private timeRemaining: number = DURATION;

  public constructor() {
    super();
    this.type = Explosion.typeName;
    this.collisionLayer = CollisionLayer.Effect;
    this.doSync = false;
    this.isCollidable = false;
    this.isVisible = true;

    this.streamEvents<StepEvent>('StepEvent').forEach(({data: {dt}}) => {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.markForDelete();
      }
    });
  }

  public renderInternal(ctx: GraphicsContext): void {
    this.render(ctx);
  }

  public render(ctx: GraphicsContext): void {
    const t = this.timeRemaining / DURATION;
    const r = explodeFunction(t) * this.radius;
    ctx.ellipse(-r, -r, 2 * r, 2 * r, this.getColor());
  }
}

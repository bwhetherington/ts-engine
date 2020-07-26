import { Entity, CollisionLayer } from 'core/entity';
import { sleep } from 'core/util';
import { StepEvent } from 'core/event';
import { GraphicsContext } from 'core/graphics';

function explodeFunction(t: number): number {
  // `t` is the time remaining in [0..1]
  t = 1 - t;
  return (t + 1) / 2;
}

const DURATION = 0.3;

export class Explosion extends Entity {
  public static typeName: string = 'Explosion';

  private timeRemaining: number = DURATION;

  public constructor() {
    super();
    this.type = Explosion.typeName;
    this.collisionLayer = CollisionLayer.Effect;
    this.doSync = false;
    this.isCollidable = false;
    this.isVisible = true;

    this.addListener<StepEvent>('StepEvent', (event) => {
      this.timeRemaining -= event.data.dt;
      if (this.timeRemaining <= 0) {
        this.markForDelete();
      }
    });
  }

  public renderInternal(ctx: GraphicsContext): void {
    this.render(ctx);
    console.log('render');
  }

  public render(ctx: GraphicsContext): void {
    const t = this.timeRemaining / DURATION;
    const r = explodeFunction(t) * 20;
    const { x, y, } = this.position;
    ctx.ellipse(x - r, y - r, 2 * r, 2 * r, this.color);
  }
}
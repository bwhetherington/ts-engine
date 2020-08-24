import { Entity, CollisionLayer } from 'core/entity';
import { sleep, clamp } from 'core/util';
import { StepEvent } from 'core/event';
import { GraphicsContext } from 'core/graphics';

const DURATION = 0.5;

export class Echo extends Entity {
  public static typeName: string = 'Echo';

  public radius: number = 20;
  public parent?: Entity;

  private timeRemaining: number = DURATION;

  public constructor() {
    super();
    this.type = Echo.typeName;
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

  private getParameter(): number {
    const t = this.timeRemaining / DURATION;
    return clamp(3 * t * t - 2 * t * t * t, 0, 1);
  }

  public renderInternal(ctx: GraphicsContext): void {
    this.render(ctx);
  }

  public setParent(entity: Entity): void {
    this.parent = entity;
    this.velocity.set(this.parent.velocity);
    this.mass = this.parent.mass;
    this.friction = this.parent.friction;
  }

  public render(ctx: GraphicsContext): void {
    const t = this.getParameter();
    console.log(t);
    ctx.withAlpha(t, (ctx) => {
      const u = (1 - t) / 3 + 1;
      ctx.setScale(u);
      this.parent?.renderInternal(ctx);
      ctx.setScale(1 / u);
    });
  }
}

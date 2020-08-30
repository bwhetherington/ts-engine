import { Entity, CollisionLayer } from 'core/entity';
import { sleep, clamp } from 'core/util';
import { StepEvent } from 'core/event';
import { GraphicsContext } from 'core/graphics';

const DURATION = 0.25;

export class Echo extends Entity {
  public static typeName: string = 'Echo';

  private parent?: Entity;
  private timeRemaining: number = DURATION;
  private duration: number = DURATION;
  private isFancy: boolean = false;

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
    const t = this.timeRemaining / this.duration;
    return clamp(3 * t * t - 2 * t * t * t, 0, 1);
  }

  public renderInternal(ctx: GraphicsContext): void {
    this.render(ctx);
  }

  public initialize(
    entity: Entity,
    isFancy: boolean = false,
    duration: number = DURATION
  ): void {
    this.parent = entity;
    this.velocity.set(this.parent.velocity);
    this.mass = this.parent.mass;
    this.friction = 0;
    this.timeRemaining = duration;
    this.duration = duration;
    this.isFancy = isFancy;
  }

  public render(ctx: GraphicsContext): void {
    const t = this.getParameter();
    ctx.withOptions({ useFancyAlpha: this.isFancy }, (ctx) => {
      ctx.withAlpha(t, (ctx) => {
        const u = 1 - t + 1;
        ctx.setScale(u);
        this.parent?.render(ctx);
        ctx.setScale(1 / u);
      });
    });
  }
}

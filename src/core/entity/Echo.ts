import { Entity, CollisionLayer } from 'core/entity';
import { sleep, clamp, smoothStep } from 'core/util';
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
    return smoothStep(t);
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
    if (this.parent) {
      const t = this.getParameter();
      const u = 2 - t;
      ctx.pipe()
        .alpha(t, this.isFancy)
        .scale(u)
        .run(this.parent.render.bind(this.parent));
    }
  }
}

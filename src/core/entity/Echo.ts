import {Entity, CollisionLayer} from 'core/entity';
import {sleep, clamp, smoothStep} from 'core/util';
import {StepEvent} from 'core/event';
import {GraphicsContext} from 'core/graphics';
import {GraphicsPipeline} from 'core/graphics/pipe';

const DURATION = 0.5;

export enum EchoVariant {
  Grow,
  Shrink,
}

export class Echo extends Entity {
  public static typeName: string = 'Echo';

  private parent?: Entity;
  private timeRemaining: number = DURATION;
  private duration: number = DURATION;
  private isFancy: boolean = false;
  private variant: EchoVariant = EchoVariant.Grow;

  public constructor() {
    super();
    this.type = Echo.typeName;
    this.collisionLayer = CollisionLayer.Effect;
    this.doSync = false;
    this.isCollidable = false;
    this.isVisible = true;
  }

  public override step(dt: number): void {
    super.step(dt);
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.markForDelete();
    }
  }

  private getParameter(): number {
    const t = this.timeRemaining / this.duration;
    return smoothStep(t);
  }

  public override renderInternal(ctx: GraphicsContext): void {
    this.render(ctx);
  }

  public initialize(
    entity: Entity,
    isFancy: boolean = false,
    duration: number = DURATION,
    variant: EchoVariant = EchoVariant.Grow
  ): void {
    this.parent = entity;
    this.velocity.set(this.parent.velocity);
    this.mass = this.parent.mass;
    this.angle = this.parent.angle;
    this.friction = 0;
    this.timeRemaining = duration;
    this.duration = duration;
    this.isFancy = isFancy;
    this.variant = variant;
  }

  public override render(ctx: GraphicsContext): void {
    if (this.parent) {
      const t = this.getParameter();
      let u;
      switch (this.variant) {
        case EchoVariant.Grow:
          u = 2 - t;
          break;
        case EchoVariant.Shrink:
          u = t / 2 + 0.5;
          break;
      }
      GraphicsPipeline.pipe()
        .alpha(t, this.isFancy)
        .scale(u)
        .run(ctx, this.parent.render.bind(this.parent));
    }
  }

  public override shouldDeleteIfOffscreen(): boolean {
    return true;
  }
}

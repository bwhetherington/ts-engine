import { Entity, CollisionLayer } from 'core/entity';
import { sleep } from 'core/util';
import { StepEvent } from 'core/event';
import { GraphicsContext } from 'core/graphics';

export class Explosion extends Entity {
  public static typeName: string = 'Explosion';

  private timeRemaining: number = 1;

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

  public render(ctx: GraphicsContext): void {
    const r = 20 - 20 * this.timeRemaining;
    console.log(r);
    const { x, y, } = this.position;
    ctx.ellipse(x - r, y - r, 2 * r, 2 * r, this.color);
  }
}
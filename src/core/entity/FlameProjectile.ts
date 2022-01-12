import {Projectile} from '@/core/entity';
import {EventManager} from '@/core/event';
import {GraphicsContext} from '@/core/graphics';
import {smoothStep, clamp} from '@/core/util';
import {Rectangle} from '@/core/geometry';

const FLAME_WIDTH = 10;

export class FlameProjectile extends Projectile {
  public static override typeName: string = 'FlameProjectile';

  private initialBoundingBox?: Rectangle;

  protected override hasTrail(): boolean {
    return false;
  }

  private getEndTime(): number {
    return this.timeCreated + this.duration;
  }

  private updateBoundingBoxSize(width: number, height: number) {
    this.initialBoundingBox ??= this.boundingBox.copy();
    this.boundingBox.width = width;
    this.boundingBox.height = height;
  }

  private getInitialSize(): number {
    return this.initialBoundingBox?.width ?? 20;
  }

  private getParameter(): number {
    const end = this.getEndTime();
    const progress = clamp((end - EventManager.timeElapsed) / this.duration, 0, 1);
    const t = smoothStep(progress);
    return 1 - t;
  }

  public override step(dt: number) {
    super.step(dt);
    const t = this.getParameter();
    const newSize = this.getInitialSize() * (1 + t * 2);
    this.updateBoundingBoxSize(
      newSize, newSize,
    );
  }

  public override render(ctx: GraphicsContext) {
    const color = {...this.getColor(), alpha: 0.75};
    const center = {...color, alpha: 0.25};
    const radius = this.boundingBox.width / 2;
    ctx.gradientCircle(
      0,
      0,
      radius / 3,
      radius,
      center,
      color
    );
  }
}
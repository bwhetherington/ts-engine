import { Text } from 'core/entity';
import { Data } from 'core/serialize';
import { GraphicsContext } from 'core/graphics';
import { clamp } from 'core/util';

const FADE_POINT = 0.5;

export class TimedText extends Text {
  public static typeName: string = 'TimedText';

  public duration: number = 1;
  public elapsed: number = 0;

  public constructor() {
    super();
    this.type = TimedText.typeName;
  }

  public step(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed > this.duration) {
      this.markForDelete();
    }
    super.step(dt);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      duration: this.duration,
      elapsed: this.elapsed,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const { duration, elapsed } = data;
    if (typeof duration === 'number') {
      this.duration = duration;
    }
    if (typeof elapsed === 'number') {
      this.elapsed == elapsed;
    }
  }

  private getParameter(): number {
    const t = (this.elapsed / this.duration - FADE_POINT) / (1 - FADE_POINT);
    return 1 - clamp(t, 0, 1);
  }

  public render(ctx: GraphicsContext): void {
    const alpha = this.getParameter();
    if (alpha < 1) {
      ctx.withAlpha(alpha, (ctx) => super.render(ctx));
    } else {
      super.render(ctx);
    }
  }
}
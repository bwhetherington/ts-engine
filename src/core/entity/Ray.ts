import {Entity, CollisionLayer, WorldManager, Echo} from 'core/entity';
import {GraphicsContext} from 'core/graphics';
import {Vector, VectorLike} from 'core/geometry';
import {sleep, clamp, smoothStep} from 'core/util';
import {LogManager} from 'core/log';
import {WHITE} from 'core/graphics/color';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {EventManager} from 'core/event';

const log = LogManager.forFile(__filename);

const DURATION = 0.25;
const BASE_THICKNESS = 8;

export class Ray extends Entity {
  public static typeName: string = 'Ray';

  private start: Vector = new Vector();
  private stop: Vector = new Vector();
  private timeElapsed: number = 0;

  public constructor() {
    super();
    this.type = Ray.typeName;
    this.collisionLayer = CollisionLayer.Effect;
    this.doSync = false;
    this.isCollidable = false;
    this.isVisible = true;
  }

  private getProgress(): number {
    return clamp(this.timeElapsed / DURATION, 0, 1);
  }

  private getParameter(): number {
    const x = this.getProgress();
    if (x < 0.5) {
      return 1;
    } else {
      const y = 1 - (x - 0.5) * 2;
      return smoothStep(y);
    }
  }

  public step(dt: number): void {
    super.step(dt);
    this.timeElapsed += dt;
  }

  public initialize(from: VectorLike, to: VectorLike): void {
    this.start.set(from);
    this.stop.set(to);

    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);

    const width = maxX - minX;
    const height = maxY - minY;

    this.boundingBox.x = minX;
    this.boundingBox.y = minY;
    this.boundingBox.width = width;
    this.boundingBox.height = height;
    this.setPositionXY(this.boundingBox.centerX, this.boundingBox.centerY);
  }

  private async loadInternal(): Promise<void> {
    await EventManager.sleep(DURATION);
    this.markForDelete();
  }

  public load(): void {
    this.loadInternal().catch((why) => log.error(why));
  }

  public render(ctx: GraphicsContext): void {
    const t = this.getParameter();
    GraphicsPipeline.pipe()
      .alpha(t)
      .options({lineWidth: BASE_THICKNESS * t})
      .translate(-this.position.x, -this.position.y)
      .run(ctx, (ctx) => {
        ctx.line(
          this.start.x,
          this.start.y,
          this.stop.x,
          this.stop.y,
          this.getColor()
        );
      });
  }
}

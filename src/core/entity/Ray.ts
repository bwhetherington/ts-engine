import {
  Entity,
  CollisionLayer,
  WorldManager,
  Unit,
  DisplayRayEvent,
} from '@/core/entity';
import {GraphicsContext} from '@/core/graphics';
import {Vector, VectorLike} from '@/core/geometry';
import {clamp, smoothStep} from '@/core/util';
import {LogManager} from '@/core/log';
import {reshade, WHITE} from '@/core/graphics/color';
import {GraphicsPipeline} from '@/core/graphics/pipe';
import {EventManager} from '@/core/event';
import {NetworkManager} from '@/core/net';

const log = LogManager.forFile(__filename);

const DURATION = 0.25;
const BASE_THICKNESS = 8;

export class Ray extends Entity {
  public static typeName: string = 'Ray';
  public static isTypeInitialized: boolean = false;

  public width: number = 1;

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

  public static initializeType() {
    Entity.initializeType();
    if (!Ray.isTypeInitialized) {
      Ray.isTypeInitialized = true;
      if (NetworkManager.isClient()) {
        EventManager.streamEvents(DisplayRayEvent)
          .map((event) => event.data)
          .forEach(({start, stop, sourceId, width}) => {
            let color;
            const source = WorldManager.getEntity(sourceId);
            if (source instanceof Unit) {
              color = reshade(source.getBaseColor(), -0.35);
            } else {
              color = WHITE;
            }

            const ray = WorldManager.spawn(Ray);
            if (!ray) {
              return;
            }
            ray.initialize(start, stop);
            ray.setColor(color);
            ray.width = width;
          });
      }
    }
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

  public override step(dt: number) {
    super.step(dt);
    this.timeElapsed += dt;
  }

  public initialize(from: VectorLike, to: VectorLike) {
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

  public override load() {
    this.loadInternal().catch((why) => log.error(why));
  }

  public override render(ctx: GraphicsContext) {
    const t = this.getParameter();
    GraphicsPipeline.pipe()
      .alpha((t * 2) / 3)
      .options({lineWidth: BASE_THICKNESS * t * this.width})
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

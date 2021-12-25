import {Entity, CollisionLayer, Unit} from 'core/entity';
import {sleep, clamp, smoothStep, Queue} from 'core/util';
import {EventManager, StepEvent} from 'core/event';
import {BLACK, GraphicsContext} from 'core/graphics';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {Vector, VectorLike} from 'core/geometry';

const DURATION = 0.1;

interface PositionSnapshot {
  time: number;
  position: VectorLike;
}

export class Trail extends Entity {
  public static typeName: string = 'Trail';

  private parent?: Entity;
  private duration: number = DURATION;
  private snapshots: Queue<PositionSnapshot> = new Queue();

  public constructor() {
    super();
    this.type = Trail.typeName;
    this.collisionLayer = CollisionLayer.BaseEffect;
    this.doSync = false;
    this.isCollidable = false;
    this.isVisible = true;
  }

  private drain() {
    while (!this.snapshots.isEmpty()) {
      // We know it's not undefined since we already checked that the list is not empty
      const lastPosition = this.snapshots.peek() as PositionSnapshot;

      if (EventManager.timeElapsed - lastPosition.time < this.duration) {
        break;
      }

      this.snapshots.dequeue();
    }
  }

  public override step(dt: number) {
    super.step(dt);
    if (this.parent?.isAlive()) {
      this.snapshots.enqueue({
        time: EventManager.timeElapsed,
        position: this.parent.position.serialize() as VectorLike,
      });
      this.position.set(this.parent.position);
    }
    this.drain();

    const {x: startX, y: startY} = this.snapshots.peek()?.position ?? {
      x: 0,
      y: 0,
    };
    const {x: endX, y: endY} = {
      x: this.parent?.position.x ?? 0,
      y: this.parent?.position.y ?? 0,
    };

    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    const width = maxX - minX;
    const height = maxY - minY;

    this.boundingBox.x = minX;
    this.boundingBox.y = minY;
    this.boundingBox.width = width;
    this.boundingBox.height = height;

    if (this.snapshots.isEmpty()) {
      this.markForDelete();
    }
  }

  public override renderInternal(ctx: GraphicsContext) {
    this.render(ctx);
  }

  public initialize(entity: Entity, duration: number = DURATION) {
    this.parent = entity;
    this.duration = duration;
  }

  public override render(ctx: GraphicsContext) {
    if (this.parent) {
      const color = {
        ...this.parent.getColor(),
        alpha: 0.75,
      };
      GraphicsPipeline.pipe()
        .options({
          lineWidth: (this.parent?.boundingBox.width ?? 20) * 0.75,
        })
        .translate(-this.position.x, -this.position.y)
        .run(ctx, (ctx) => {
          const points = this.snapshots
            .iterator()
            .map(({position}) => position);
          ctx.path(points, color, true);
        });
    }
  }

  public override shouldDeleteIfOffscreen(): boolean {
    return true;
  }
}

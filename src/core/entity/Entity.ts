import { Bounded, Rectangle, Vector } from 'core/geometry';
import { GraphicsContext, Color, invert, CameraManager, Renderable } from 'core/graphics';
import { WHITE, isColor } from 'core/graphics/color';
import { v1 as genUuid } from 'uuid';
import { CollisionLayer, WorldManager, CollisionEvent } from 'core/entity';
import { Data, Serializable } from 'core/serialize';
import { isCollisionLayer, shuntOutOf } from './util';
import { EventData, Handler, EventManager, Event } from 'core/event';
import { UUIDManager } from 'core/uuid';
import { NetworkManager } from 'core/net';

export type Uuid = string;

export class Entity implements Bounded, Serializable, Renderable {
  public static typeName: string = 'Entity';

  public boundingBox: Rectangle = new Rectangle(20, 20, 0, 0);
  public position: Vector = new Vector(0, 0);
  public velocity: Vector = new Vector(0, 0);
  public vectorBuffer: Vector = new Vector(0, 0);
  public id: Uuid;
  private color: Color = WHITE;
  public collisionLayer: CollisionLayer = CollisionLayer.Unit;
  public highlight: boolean = false;
  public type: string;
  public mass: number = 1;
  public markedForDelete: boolean = false;
  public friction: number = 0;
  public bounce: number = 1;
  public isVisible: boolean = true;
  public isCollidable: boolean = true;
  public doSync: boolean = true;
  private handlers: Record<string, Set<string>> = {};

  constructor() {
    this.id = UUIDManager.generate();
    this.type = Entity.typeName;
  }

  public applyForce(force: Vector, scalar: number = 1): void {
    this.velocity.add(force, scalar / this.mass);
  }

  public setPosition(point: Vector): void {
    this.setPositionXY(point.x, point.y);
  }

  public setPositionXY(x: number, y: number): void {
    this.position.setXY(x, y);
    this.updateBoundingBox();
  }

  public addPosition(diff: Vector, scale: number = 1): void {
    this.addPositionXY(diff.x, diff.y, scale);
  }

  public addPositionXY(dx: number, dy: number, scale: number = 1): void {
    this.position.addXY(dx, dy, scale);
    this.updateBoundingBox();
  }

  public renderInternal(ctx: GraphicsContext): void {
    if (this.isVisible) {
      this.render(ctx);
    }
  }

  public render(ctx: GraphicsContext): void {
    const { x, y, width, height } = this.boundingBox;
    ctx.rect(x, y, width, height, this.color);
  }

  private updateBoundingBox(): void {
    this.boundingBox.centerX = this.position.x;
    this.boundingBox.centerY = this.position.y;
  }

  private updatePosition(dt: number): void {
    this.addPosition(this.velocity, dt);
    if (this.isCollidable) {
      // Query for entities that may collide with this entity
      let collided = false;
      WorldManager.query(this.boundingBox)
        .filter(
          (candidate) =>
            candidate.isCollidable &&
            this.id !== candidate.id &&
            this.boundingBox.intersects(candidate.boundingBox)
        )
        .forEach((candidate) => {
          // Collision
          if (
            this.collisionLayer === CollisionLayer.Unit &&
            candidate.collisionLayer === CollisionLayer.Geometry
          ) {
            shuntOutOf(this, candidate.boundingBox);
          }

          collided = true;
          const event = {
            type: 'CollisionEvent',
            data: <CollisionEvent>{
              collider: this,
              collided: candidate,
            },
          };
          EventManager.emit(event);
        });

      // Apply friction
      const normal = this.friction * this.mass;
      if (normal > 0) {
        const oldAngle = this.velocity.angle;
        this.vectorBuffer.set(this.velocity);
        this.vectorBuffer.normalize();
        const scale = -dt * normal;
        this.velocity.add(this.vectorBuffer, scale);
        const newAngle = this.velocity.angle;
        if (oldAngle - newAngle > 0.01 || this.velocity.magnitude < 1) {
          this.velocity.setXY(0, 0);
        }
      }
    }
  }

  public step(dt: number): void {
    // if (
    //   NetworkManager.isClient() &&
    //   !CameraManager.boundingBox.intersects(this.boundingBox)
    // ) {
    //   return;
    // }
    this.updatePosition(dt);
  }

  public serialize(): Data {
    return {
      id: this.id,
      type: this.type,
      mass: this.mass,
      friction: this.friction,
      bounce: this.bounce,
      color: this.getColor(),
      collisionLayer: this.collisionLayer,
      isVisible: this.isVisible,
      doSync: this.doSync,
      isCollidable: this.isCollidable,
      boundingBox: this.boundingBox.serialize(),
      position: this.position.serialize(),
      velocity: this.velocity.serialize(),
    };
  }

  public deserialize(data: Data): void {
    const {
      id,
      type,
      mass,
      color,
      collisionLayer,
      boundingBox,
      position,
      velocity,
      friction,
      bounce,
      isVisible,
      isCollidable,
      doSync,
    } = data;
    if (typeof id === 'string') {
      this.id = id;
    }
    if (typeof type === 'string') {
      this.type = type;
    }
    if (typeof mass === 'number') {
      this.mass = mass;
    }
    if (typeof friction === 'number') {
      this.friction = friction;
    }
    if (typeof bounce === 'number') {
      this.bounce = bounce;
    }
    if (typeof isVisible === 'boolean') {
      this.isVisible = isVisible;
    }
    if (typeof isCollidable === 'boolean') {
      this.isCollidable = isCollidable;
    }
    if (typeof doSync === 'boolean') {
      this.doSync = true;
    }
    if (isColor(color)) {
      this.setColor(color);
    }
    if (isCollisionLayer(collisionLayer)) {
      this.collisionLayer = collisionLayer;
    }
    if (boundingBox !== undefined) {
      this.boundingBox.deserialize(boundingBox);
    }
    if (position !== undefined) {
      this.position.deserialize(position);
    }
    if (velocity !== undefined) {
      this.velocity.deserialize(velocity);
    }
  }

  public setColor(color: Color): void {
    this.color = color;
  }

  public getColor(): Color {
    return this.color;
  }

  public markForDelete(): void {
    this.markedForDelete = true;
  }

  private getHandlers(type: string): Set<string> {
    let handlers = this.handlers[type];
    if (handlers === undefined) {
      handlers = new Set();
      this.handlers[type] = handlers;
    }
    return handlers;
  }

  public addListener<E extends EventData>(
    type: string,
    handler: Handler<E>
  ): void {
    const id = EventManager.addListener(type, handler);
    this.getHandlers(type).add(id);
  }

  public handleEvent<E extends EventData>(type: string, event: Event<E>): void {
    const handlers = this.handlers[type] ?? [];
    for (const handlerID of handlers) {
      const handler = EventManager.getHandler(type, handlerID);
      handler?.call(null, event, handlerID);
    }
  }

  public cleanup(): void {
    for (const type in this.handlers) {
      const handlerSet = this.handlers[type];
      for (const id of handlerSet) {
        EventManager.removeListener(type, id);
      }
    }
    UUIDManager.free(this.id);
  }

  public toString(): string {
    return this.type + '[' + this.id + ']';
  }
}

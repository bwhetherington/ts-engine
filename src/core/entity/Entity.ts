import { Bounded, Rectangle, Vector } from 'core/geometry';
import { GraphicsContext, Color, invert } from 'core/graphics';
import { WHITE, BLACK, isColor } from 'core/graphics/color';
import { v1 as genUuid } from 'uuid';
import { CollisionLayer, WM, CollisionEvent } from 'core/entity';
import { Data, Serializable } from 'core/serialize';
import { isCollisionLayer, shuntOutOf } from './util';
import { GameHandler, EventData, Handler, EM } from 'core/event';

export type Uuid = string;

export class Entity implements Bounded, Serializable {
  public static typeName: string = 'Entity';

  public boundingBox: Rectangle = new Rectangle(20, 20, 0, 0);
  public position: Vector = new Vector(0, 0);
  public velocity: Vector = new Vector(0, 0);
  public frictionBuffer: Vector = new Vector(0, 0);
  public id: Uuid;
  public color: Color = WHITE;
  public collisionLayer: CollisionLayer = 'unit';
  public highlight: boolean = false;
  public type: string;
  public mass: number = 1;
  public markedForDelete: boolean = false;
  public friction: number = 0;
  public bounce: number = 1;
  private handlers: Record<string, Set<string>> = {};

  constructor() {
    this.id = genUuid();
    this.type = Entity.typeName;
  }

  public applyForce(force: Vector): void {
    this.velocity.add(force, 1 / this.mass);
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

  public render(ctx: GraphicsContext): void {
    const { x, y, width, height } = this.boundingBox;
    if (this.highlight) {
      ctx.rect(x, y, width, height, { red: 0.85, green: 0.1, blue: 0.1 });
    } else {
      ctx.rect(x, y, width, height, this.color);
    }
  }

  private updateBoundingBox(): void {
    this.boundingBox.x = this.position.x;
    this.boundingBox.y = this.position.y;
  }

  private updatePosition(dt: number): void {
    this.addPosition(this.velocity, dt);
    // Query for entities that may collide with this entity
    let collided = false;
    // for (const candidate of this.getEntities()) {
    for (const candidate of WM.query(this.boundingBox)) {
      if (
        this.id !== candidate.id &&
        (this.boundingBox.intersects(candidate.boundingBox) ||
          candidate.boundingBox.intersects(this.boundingBox))
      ) {
        // Collision
        if (
          this.collisionLayer === 'unit' &&
          candidate.collisionLayer === 'geometry'
        ) {
          shuntOutOf(this, candidate.boundingBox);
        }

        collided = true;
        const data = <CollisionEvent>{
          collider: this,
          collided: candidate,
        };
        const event = {
          type: 'CollisionEvent',
          data,
        };
        EM.emit(event);
      }
    }

    // Apply friction
    const normal = this.friction * this.mass;
    if (normal > 0) {
      const oldAngle = this.velocity.angle;
      this.frictionBuffer.set(this.velocity);
      this.frictionBuffer.normalize();
      const scale = -dt * normal;
      this.velocity.add(this.frictionBuffer, scale);
      const newAngle = this.velocity.angle;
      if (oldAngle - newAngle > 0.01 || this.velocity.magnitude < 1) {
        this.velocity.setXY(0, 0);
      }
    }
  }

  public step(dt: number): void {
    this.updatePosition(dt);
  }

  public serialize(): Data {
    return {
      id: this.id,
      type: this.type,
      mass: this.mass,
      friction: this.friction,
      bounce: this.bounce,
      color: this.color,
      collisionLayer: this.collisionLayer,
      boundingBox: this.boundingBox.serialize(),
      position: this.position.serialize(),
      velocity: this.velocity.serialize(),
      frictionBuffer: this.frictionBuffer.serialize(),
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
      frictionBuffer,
      friction,
      bounce,
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
    if (isColor(color)) {
      this.color = color;
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
    if (frictionBuffer !== undefined) {
      this.frictionBuffer.deserialize(frictionBuffer);
    }
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
    const id = EM.addListener(type, handler);
    this.getHandlers(type).add(id);
  }

  public cleanup(): void {
    for (const type in this.handlers) {
      const handlerSet = this.handlers[type];
      for (const id of handlerSet) {
        EM.removeListener(type, id);
      }
    }
  }
}

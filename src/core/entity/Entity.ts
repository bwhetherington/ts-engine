import {Bounded, Rectangle, Vector} from 'core/geometry';
import {GraphicsContext, Color, Renderable, CameraManager} from 'core/graphics';
import {WHITE, isColor} from 'core/graphics/color';
import {CollisionLayer, WorldManager, CollisionEvent} from 'core/entity';
import {Data, Serializable} from 'core/serialize';
import {isCollisionLayer, shuntOutOf} from './util';
import {EventManager, Observer} from 'core/event';
import {UUID, UUIDManager} from 'core/uuid';
import {AsyncIterator} from 'core/iterator';
import {DataBuffer, DataSerializable} from 'core/buf';
import {GraphicsPipeline} from 'core/graphics/pipe';

export class Entity extends Observer
  implements Bounded, DataSerializable, Serializable, Renderable {
  public static typeName: string = 'Entity';
  public static typeNum: number = 0;
  public static isTypeInitialized: boolean = false;

  public boundingBox: Rectangle = new Rectangle(20, 20, 0, 0);
  public position: Vector = new Vector(0, 0);
  public velocity: Vector = new Vector(0, 0);
  public angle: number = 0;
  public vectorBuffer: Vector = new Vector(0, 0);
  public id: UUID;
  public color: Color = WHITE;
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
  public isSpatial: boolean = false;
  public isInitialized: boolean = false;

  constructor() {
    super();
    this.id = UUIDManager.generate();
    this.type = Entity.typeName;
  }

  public static initializeType(): void {
    if (!Entity.isTypeInitialized) {
      Entity.isTypeInitialized = true;
    }
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
    const {width, height} = this.boundingBox;
    GraphicsPipeline.pipe().run(ctx, (ctx) => {
      ctx.rect(-width / 2, -height / 2, width, height, this.getColor());
    });
  }

  private updateBoundingBox(): void {
    this.boundingBox.centerX = this.position.x;
    this.boundingBox.centerY = this.position.y;
  }

  protected getTotalFriction(): number {
    switch (this.collisionLayer) {
      case CollisionLayer.Effect:
      case CollisionLayer.HUD:
        return this.friction;
      default:
        return this.friction * WorldManager.friction;
    }
  }

  private updatePosition(dt: number): void {
    if (this.isAlive()) {
      this.addPosition(this.velocity, dt);
    }

    if (this.isCollidable) {
      // Query for entities that may collide with this entity
      let collided = false;
      WorldManager.query(this.boundingBox)
        .filter(
          (candidate) =>
            candidate.isCollidable &&
            candidate !== this
        )
        .forEach((candidate) => {
          // Collision
          if (
            (this.collisionLayer === CollisionLayer.Unit ||
              this.collisionLayer === CollisionLayer.Projectile) &&
            candidate.collisionLayer === CollisionLayer.Geometry
          ) {
            shuntOutOf(this, candidate.boundingBox);
          }

          this.collide(candidate);

          const event = {
            type: 'CollisionEvent',
            data: <CollisionEvent>{
              collider: this,
              collided: candidate,
            },
          };
          EventManager.emit(event);
        });
    }

    // Apply friction
    const normal = this.getTotalFriction();
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

  public step(dt: number): void {
    this.updatePosition(dt);
  }

  public isAlive(): boolean {
    return !this.markedForDelete;
  }

  public serialize(): Data {
    const data = {
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
      isSpatial: this.isSpatial,
      angle: this.angle,
      boundingBox: this.boundingBox.serialize(),
      position: this.position.serialize(),
      velocity: this.velocity.serialize(),
    };
    return data;
  }

  public dataSize(): number {
    return 84;
  }

  public dataSerialize(buf: DataBuffer): void {
    buf.writeString(this.type, 20); // 24 - 24
    buf.writeUInt32(this.id); // 4  - 28
    this.position.dataSerialize(buf); // 8  - 36
    this.velocity.dataSerialize(buf); // 8  - 44
    this.boundingBox.dataSerialize(buf); // 16 - 60
    buf.writeFloat(this.mass); // 4  - 64
    buf.writeFloat(this.friction); // 4  - 68
    buf.writeFloat(this.bounce); // 4  - 72
    buf.writeFloat(this.angle); // 4  - 76
    buf.writeBoolean(this.isCollidable); // 1  - 77
    buf.writeBoolean(this.doSync); // 1  - 78
    buf.writeBoolean(this.isVisible); // 1  - 79
    buf.writeUInt8(this.collisionLayer); // 1  - 80
    buf.writeColor(this.getColor()); // 4  - 84
  }

  public dataDeserialize(buf: DataBuffer): void {
    this.type = buf.readString();
    this.id = buf.readUInt32();
    this.position.dataDeserialize(buf);
    this.velocity.dataDeserialize(buf);
    this.boundingBox.dataDeserialize(buf);
    this.mass = buf.readFloat();
    this.friction = buf.readFloat();
    this.bounce = buf.readFloat();
    this.angle = buf.readFloat();
    this.isCollidable = buf.readBoolean();
    this.doSync = buf.readBoolean();
    this.isVisible = buf.readBoolean();
    this.collisionLayer = buf.readUInt8();
    this.deserializeColor(buf.readColor());
  }

  protected deserializeColor(data: Data): void {
    const {red, green, blue, alpha} = data;
    const newColor = {...this.color};
    if (typeof red === 'number') {
      newColor.red = red;
    }
    if (typeof green === 'number') {
      newColor.green = green;
    }
    if (typeof blue === 'number') {
      newColor.blue = blue;
    }
    if (typeof alpha === 'number') {
      newColor.alpha = alpha;
    }
    this.setColor(newColor);
  }

  public deserialize(data: Data, setInitialized: boolean = false): void {
    const {
      id,
      type,
      mass,
      color,
      collisionLayer,
      boundingBox,
      position,
      angle,
      velocity,
      friction,
      bounce,
      isVisible,
      isCollidable,
      isSpatial,
      doSync,
    } = data;
    if (typeof id === 'number') {
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
    if (typeof angle === 'number') {
      this.angle = angle;
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
    if (typeof isSpatial === 'boolean') {
      this.isSpatial = isSpatial;
    }
    if (typeof doSync === 'boolean') {
      this.doSync = true;
    }
    if (color) {
      this.deserializeColor(color);
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
    if (setInitialized) {
      this.isInitialized = true;
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

  public toString(): string {
    return `${this.type}(${this.id})`;
  }

  public collide(other?: Entity): void {}

  public streamCollisions(): AsyncIterator<CollisionEvent> {
    return this.streamEvents<CollisionEvent>('CollisionEvent')
      .map(({data}) => data)
      .filter(({collider}) => collider.id === this.id);
  }

  public afterStep(): void {}

  public load(): void {}

  public cleanup(): void {
    super.cleanup();
    UUIDManager.free(this.id);
  }

  public shouldUpdateLocally(): boolean {
    // return !this.isInitialized || CameraManager.isInFrame(this);
    return true;
  }

  public shouldDeleteIfOffscreen(): boolean {
    return false;
  }
}

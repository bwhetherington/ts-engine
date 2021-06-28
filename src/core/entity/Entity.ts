import {Bounded, Rectangle, Vector} from 'core/geometry';
import {
  GraphicsContext,
  Color,
  Renderable,
  Sprite,
  PIXEL_SIZE,
} from 'core/graphics';
import {WHITE, isColor} from 'core/graphics/color';
import {CollisionLayer, WorldManager, CollisionEvent} from 'core/entity';
import {Data, Serializable} from 'core/serialize';
import {isCollisionLayer, shuntOutOf} from './util';
import {EventManager, Observer} from 'core/event';
import {isUUID, UUID, UUIDManager} from 'core/uuid';
import {AsyncIterator} from 'core/iterator';
import {DataBuffer, DataSerializable} from 'core/buf';
import {clamp} from 'core/util';
import {NetworkManager} from 'core/net';
import {AssetManager} from 'core/assets';
import {GraphicsPipeline} from 'core/graphics/pipe';

export class Entity extends Observer
  implements Bounded, DataSerializable, Serializable, Renderable {
  public static typeName: string = 'Entity';
  public static typeNum: number = 0;
  public static isTypeInitialized: boolean = false;

  public boundingBox: Rectangle = new Rectangle(8, 8, 0, 0);
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
  public attachedTo?: Entity;

  protected sprite?: Sprite;
  private spritePath: string = '';
  private isExternal: boolean = false;
  private smoothTarget: Vector = new Vector();

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

  private renderSprite(ctx: GraphicsContext, sprite: Sprite): void {
    GraphicsPipeline.pipe()
      // .rotate(-this.angle)
      // .translate(-this.position.x, -this.position.y)
      // .translate(Math.floor(this.position.x / PIXEL_SIZE), Math.floor(this.position.y / PIXEL_SIZE))
      .run(ctx, (ctx) => {
        ctx.sprite(sprite);
      });
  }

  public render(ctx: GraphicsContext): void {
    if (this.sprite) {
      this.renderSprite(ctx, this.sprite);
    } else {
      const {width, height} = this.boundingBox;
      ctx.box(-width / 2, -height / 2, width, height);
    }

    // const {width, height} = this.boundingBox;
    // GraphicsPipeline.pipe().run(ctx, (ctx) => {
    //   ctx.rect(-width / 2, -height / 2, width, height, this.getColor());
    // });
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

  public attachTo(entity: Entity): void {
    this.attachedTo = entity;
  }

  protected onSnappedToTarget(): void {}

  protected onSmoothPosition(movement: Vector): void {
    this.angle = movement.angle;
  }

  private updatePosition(dt: number): void {
    if (this.isAlive()) {
      if (this.attachedTo?.isAlive()) {
        this.setPosition(this.attachedTo.position);
      } else {
        this.addPosition(this.velocity, dt);
      }
    }

    const shouldSmooth = this.shouldSmooth();

    if (shouldSmooth) {
      // Move closer to parent entity
      const snapDistance = 0.25 ** 2;
      if (
        this.position.distanceToXYSquared(
          this.smoothTarget.x,
          this.smoothTarget.y
        ) <= snapDistance
      ) {
        this.setPosition(this.smoothTarget);
        this.onSnappedToTarget();
        return;
      }

      this.vectorBuffer.set(this.smoothTarget);
      this.vectorBuffer.add(this.position, -1);
      this.onSmoothPosition(this.vectorBuffer);
      const increment = clamp(10 * dt, 0, 1);
      this.addPosition(this.vectorBuffer, increment);
    }

    if (this.isCollidable) {
      // Query for entities that may collide with this entity
      WorldManager.query(this.boundingBox)
        .filter((candidate) => candidate.isCollidable && candidate !== this)
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

          EventManager.emit<CollisionEvent>({
            type: 'CollisionEvent',
            data: {
              collider: this,
              collided: candidate,
            },
          });
        });
    }

    // Apply friction
    if (!shouldSmooth) {
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
      attachedTo: this.attachedTo?.id,
      spritePath: this.spritePath,
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

  public async setSprite(path: string): Promise<void> {
    this.spritePath = path;
    if (NetworkManager.isClient()) {
      const sprite = await AssetManager.loadSprite(path);
      sprite.playAnimation({
        animation: 'standFront',
        repeat: true,
      });
      this.sprite = sprite;
    }
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
      attachedTo,
      spritePath,
    } = data;
    if (setInitialized) {
      this.isExternal = true;
    }
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
    if (velocity !== undefined) {
      this.velocity.deserialize(velocity);
    }
    if (position !== undefined) {
      // Extrapolate predicted position from velocity
      this.vectorBuffer.set(this.position);
      this.vectorBuffer.deserialize(position);
      // let ping = PlayerManager.getActivePlayer()?.ping;
      // if (ping) {
      //   ping = clamp(ping, 0, 0.1);
      //   this.vectorBuffer.add(this.velocity, ping);
      // }

      if (this.shouldSmooth()) {
        this.smoothTarget.set(this.vectorBuffer);
        if (!this.isInitialized) {
          this.position.set(position);
        }
      } else {
        this.position.set(position);
      }
    }
    if (setInitialized) {
      this.isInitialized = true;
    }
    if (isUUID(attachedTo)) {
      const parent = WorldManager.getEntity(attachedTo);
      if (parent) {
        this.attachedTo = parent;
      }
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

  public shouldSmooth(): boolean {
    return NetworkManager.isClient() && this.isExternal;
  }
}

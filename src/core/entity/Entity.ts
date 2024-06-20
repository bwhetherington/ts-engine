import {Bounded, Rectangle, Vector} from '@/core/geometry';
import {GraphicsContext, Color, Renderable} from '@/core/graphics';
import {WHITE, tryColor} from '@/core/graphics/color';
import {CollisionLayer, WorldManager, CollisionEvent} from '@/core/entity';
import {Data, Serializable} from '@/core/serialize';
import {isCollisionLayer, shuntOutOf} from './util';
import {EventManager, Observer} from '@/core/event';
import {isUUID, UUID, UUIDManager} from '@/core/uuid';
import {AsyncIterator} from '@/core/iterator';
import {GraphicsPipeline} from '@/core/graphics/pipe';
import {clamp} from '@/core/util';
import {NetworkManager} from '@/core/net';
import {Config, ConfigManager} from '../config';

export class Entity
  extends Observer
  implements Bounded, Serializable, Renderable
{
  public static typeName: string = 'Entity';
  public static typeNum: number = 0;

  protected static config: Config = new Config();

  public boundingBox: Rectangle = new Rectangle(20, 20, 0, 0);
  public position: Vector = new Vector(0, 0);
  public velocity: Vector = new Vector(0, 0);
  public angle: number = 0;
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

  protected timeCreated: number;

  private isExternal: boolean = false;
  private smoothTarget: Vector = new Vector();
  private smoothAngleTarget: number = 0;

  constructor() {
    super();
    this.id = UUIDManager.generate();
    this.type = Entity.typeName;
    this.timeCreated = EventManager.timeElapsed;
  }

  public static initializeType() {
    this.config = ConfigManager.getConfig('EntityConfig');
  }

  public applyForce(force: Vector, scalar: number = 1) {
    this.velocity.add(force, scalar / this.getMass());
  }

  public setPosition(point: Vector) {
    this.setPositionXY(point.x, point.y);
  }

  public setPositionXY(x: number, y: number) {
    this.position.setXY(x, y);
    this.updateBoundingBox();
  }

  public addPosition(diff: Vector, scale: number = 1) {
    this.addPositionXY(diff.x, diff.y, scale);
  }

  public addPositionXY(dx: number, dy: number, scale: number = 1) {
    this.position.addXY(dx, dy, scale);
    this.updateBoundingBox();
  }

  public renderInternal(ctx: GraphicsContext) {
    if (this.isVisible) {
      this.render(ctx);
    }
  }

  public render(ctx: GraphicsContext) {
    const {width, height} = this.boundingBox;
    GraphicsPipeline.pipe().run(ctx, (innerCtx) => {
      innerCtx.ellipse(-width / 2, -height / 2, width, height, this.getColor());
    });
  }

  private updateBoundingBox() {
    this.boundingBox.centerX = this.position.x;
    this.boundingBox.centerY = this.position.y;
  }

  protected getTotalFriction(): number {
    switch (this.collisionLayer) {
      case CollisionLayer.Effect:
      case CollisionLayer.HUD:
        return this.getFriction();
      default:
        return this.getFriction() * WorldManager.friction;
    }
  }

  public attachTo(entity: Entity) {
    this.attachedTo = entity;
  }

  protected smoothAngle(from: number, to: number, dt: number): number {
    let angle = from;
    angle %= 2 * Math.PI;

    let angleDiff = to - angle;

    if (Math.abs(to - from + 2 * Math.PI) < Math.abs(angleDiff)) {
      angleDiff = to - from + 2 * Math.PI;
    }

    if (angleDiff > Math.PI) {
      angleDiff -= 2 * Math.PI;
    }

    const smoothIncrement = Entity.config.get('smoothIncrement');
    const angleIncrement = smoothIncrement * dt * angleDiff;
    angle += angleIncrement;
    angle %= 2 * Math.PI;

    if (Math.abs(angle - to) < Math.PI / 180) {
      angle = to;
    }

    return angle;
  }

  private updatePosition(dt: number) {
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
      } else {
        Vector.BUFFER.set(this.smoothTarget);
        Vector.BUFFER.add(this.position, -1);
        const increment = clamp(
          Entity.config.get('smoothIncrement') * dt,
          0,
          1
        );
        this.addPosition(Vector.BUFFER, increment);
      }

      // Smooth angle
      this.angle = this.smoothAngle(this.angle, this.smoothAngleTarget, dt);

      return;
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

          EventManager.emitEvent(CollisionEvent, {
            collider: this,
            collided: candidate,
          });
        });
    }

    // Apply friction
    const normal = this.getTotalFriction();
    if (normal > 0) {
      const oldAngle = this.velocity.angle;
      Vector.BUFFER.set(this.velocity);
      Vector.BUFFER.normalize();
      const scale = -dt * normal;
      this.velocity.add(Vector.BUFFER, scale);
      const newAngle = this.velocity.angle;
      if (oldAngle - newAngle > 0.01 || this.velocity.magnitude < 1) {
        this.velocity.setXY(0, 0);
      }
    }
  }

  public step(dt: number) {
    this.updatePosition(dt);
  }

  public isAlive(): boolean {
    return !this.markedForDelete;
  }

  public getMass(): number {
    return this.mass;
  }

  public getFriction(): number {
    return this.friction;
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
    };
    return data;
  }

  protected deserializeColor(data: Data) {
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

  public deserialize(data: Data, setInitialized: boolean = false) {
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
    } = data;
    if (setInitialized) {
      this.isExternal = true;
    }
    if (isUUID(id)) {
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
      if (this.shouldSmooth()) {
        this.smoothAngleTarget = angle;
      } else {
        this.angle = angle;
      }
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
    if (color !== undefined) {
      const validated = tryColor(color);
      if (validated) {
        this.setColor(validated);
      } else {
        this.deserializeColor(color);
      }
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
      if (this.shouldSmooth()) {
        // Extrapolate predicted position from velocity
        Vector.BUFFER.set(this.smoothTarget);
        Vector.BUFFER.deserialize(position);
        this.smoothTarget.set(Vector.BUFFER);
        if (!this.isInitialized && setInitialized) {
          this.position.deserialize(position);
        }
      } else {
        this.position.deserialize(position);
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

  public setColor(color: Color) {
    this.color = color;
  }

  public getColor(): Color {
    return this.color;
  }

  public markForDelete() {
    this.markedForDelete = true;
  }

  public isMarkedForDelete(): boolean {
    return this.markedForDelete;
  }

  public override toString(): string {
    return `${this.type}[${this.id}]`;
  }

  public collide(_other?: Entity) {}

  public streamCollisions(): AsyncIterator<CollisionEvent> {
    return this.streamEvents(CollisionEvent)
      .map(({data}) => data)
      .filter(({collider}) => collider.id === this.id);
  }

  public afterStep() {}

  public load() {}

  public override cleanup() {
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

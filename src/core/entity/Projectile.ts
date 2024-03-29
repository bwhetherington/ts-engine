import {
  Entity,
  Trail,
  Unit,
  WorldManager,
  Echo,
  EchoVariant,
  CollisionLayer,
  DamageType,
} from '@/core/entity';
import {GraphicsContext, rgba} from '@/core/graphics';
import {Data} from '@/core/serialize';
import {NetworkManager} from '@/core/net';
import {isUUID, UUID} from '@/core/uuid';
import {EventManager} from '@/core/event';
import {GraphicsPipeline} from '@/core/graphics/pipe';

const DURATION = 1.5;

export type ProjectileShape = 'circle' | 'triangle';

const PROJECTILE_SHAPES = ['circle', 'triangle'];

export function isProjectileShape(x: any): x is ProjectileShape {
  return typeof x === 'string' && PROJECTILE_SHAPES.includes(x);
}

export class Projectile extends Entity {
  public static typeName: string = 'Projectile';

  public pierce: number = 1;
  public damage: number = 15;
  private hasExploded: boolean = false;
  public parent?: Unit;
  public duration: number = DURATION;
  public shape: ProjectileShape = 'circle';
  public showExplosion: boolean = true;
  public bounces: number = 0;

  protected hitEntities: Set<UUID> = new Set();
  public ignoreEntities: Set<UUID> = new Set();

  public onHit?: (target?: Unit) => void;

  constructor() {
    super();
    this.type = Projectile.typeName;
    this.collisionLayer = CollisionLayer.Projectile;
    this.friction = 350;
    this.bounce = 0;
    this.mass = 0.05;
    this.setColor(rgba(1.0, 0.6, 0.3, 0.8));
    this.boundingBox.width = 20;
    this.boundingBox.height = 20;

    if (NetworkManager.isClient() && this.hasTrail()) {
      const trail = WorldManager.spawn(Trail);
      trail?.initialize(this);
    }
  }

  protected hasTrail(): boolean {
    return true;
  }

  public override step(dt: number) {
    super.step(dt);
    if (
      NetworkManager.isServer() &&
      EventManager.timeElapsed - this.timeCreated > this.duration
    ) {
      this.remove(false);
    }
  }

  public override collide(other?: Entity) {
    super.collide(other);

    if (
      other === undefined ||
      other.collisionLayer === CollisionLayer.Geometry
    ) {
      // Bounce off of a wall
      this.bounces -= 1;
      if (this.bounces < 0) {
        this.hit();
        this.remove(this.showExplosion);
      }
      return;
    }

    if (other === this.parent) {
      return;
    }

    if (other instanceof Unit && NetworkManager.isServer()) {
      if (this.parent && !this.parent.isHostileTo(other)) {
        // Ignore allied units
        return;
      }

      this.hit(other);
    }
  }

  private explodeInternal() {
    if (NetworkManager.isClient()) {
      this.explode();
      this.hasExploded = true;
    }
  }

  protected explode() {
    const echo = WorldManager.spawn(Echo, this.position);
    if (!echo) {
      return;
    }
    echo.initialize(this, false, 0.35, EchoVariant.Shrink);
    echo.velocity.zero();
  }

  public remove(_showExplosion: boolean = true) {
    if (NetworkManager.isServer()) {
      this.markForDelete();
    } else {
      this.isVisible = false;
      this.isCollidable = false;
      if (!this.hasExploded && this.showExplosion) {
        this.explodeInternal();
      }
    }
  }

  public override isAlive(): boolean {
    return super.isAlive() && !this.hasExploded;
  }

  protected onHitInternal(_target?: Unit) {}

  public hit(unit?: Unit): boolean {
    if (unit) {
      if (
        !this.hitEntities.has(unit.id) &&
        !this.ignoreEntities.has(unit.id) &&
        this.hitEntities.size < this.pierce
      ) {
        unit.damage(this.damage, DamageType.Physical, this.parent);
        unit.applyForce(this.velocity, this.mass);
        this.onHitInternal(unit);
        this.onHit?.(unit);
        this.hitEntities.add(unit.id);

        if (this.hitEntities.size >= this.pierce) {
          this.remove(this.showExplosion);
          return false;
        }
      } else {
        return false;
      }
    } else {
      this.onHitInternal();
    }
    return true;
  }

  public override render(ctx: GraphicsContext) {
    const {width, height} = this.boundingBox;
    GraphicsPipeline.pipe().run(ctx, (ctx) => {
      switch (this.shape) {
        case 'circle':
          ctx.ellipse(-width / 2, -height / 2, width, height, this.getColor());
          break;
        case 'triangle':
          ctx.polygon(
            [
              {y: -width * 0.5, x: -width * 0.5},
              {y: width * 0.5, x: -width * 0.5},
              {y: 0, x: width * 0.75},
            ],
            this.getColor()
          );
      }
    });
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      damage: this.damage,
      parentId: this.parent?.id,
      hitEntities: [...this.hitEntities],
      ignoreEntities: [...this.ignoreEntities],
      pierce: this.pierce,
      duration: this.duration,
      shape: this.shape,
      showExplosion: this.showExplosion,
      bounces: this.bounces,
      hasTrail: this.hasTrail(),
    };
  }

  public override deserialize(data: Data) {
    super.deserialize(data);

    const {
      damage,
      parentId,
      hitEntities,
      ignoreEntities,
      pierce,
      duration,
      shape,
      showExplosion,
      bounces,
    } = data;

    if (typeof bounces === 'number') {
      this.bounces = bounces;
    }

    if (typeof duration === 'number') {
      this.duration = duration;
    }

    if (typeof damage === 'number') {
      this.damage = damage;
    }

    if (typeof pierce === 'number') {
      this.pierce = pierce;
    }

    if (isUUID(parentId)) {
      const parent = WorldManager.getEntity(parentId);
      if (parent instanceof Unit) {
        this.parent = parent;
        this.setColor(parent.getBaseColor());
      }
    }

    if (hitEntities instanceof Array) {
      this.hitEntities = new Set(hitEntities);
    }

    if (ignoreEntities instanceof Array) {
      this.ignoreEntities = new Set(ignoreEntities);
    }

    if (isProjectileShape(shape)) {
      this.shape = shape;
    }

    if (typeof showExplosion === 'boolean') {
      this.showExplosion = showExplosion;
    }
  }

  public override cleanup() {
    if (!this.hasExploded) {
      this.explodeInternal();
    }
    super.cleanup();
  }
}

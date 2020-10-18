import { Entity, CollisionEvent, Unit, WorldManager } from 'core/entity';
import { GraphicsContext, Color, rgb, rgba } from 'core/graphics';
import { LogManager } from 'core/log';
import { CollisionLayer } from './util';
import { Data } from 'core/serialize';
import { NetworkManager } from 'core/net';
import { Explosion } from './Explosion';
import { sleep, clamp } from 'core/util';
import { WHITE } from 'core/graphics/color';
import { UUID } from 'core/uuid';
import { iterator, iterateObject } from 'core/iterator';
import { Echo } from './Echo';
import { EventManager } from 'core/event';

const log = LogManager.forFile(__filename);

const DURATION = 1.5;

export class Projectile extends Entity {
  public static typeName: string = 'Projectile';

  public pierce: number = 1;
  public damage: number = 15;
  private hasExploded: boolean = false;
  public parent?: Unit;
  public duration: number = DURATION;
  private hasBegun: boolean = false;

  private hitEntities: Set<UUID> = new Set();

  public onHit?: (target?: Unit) => void;

  constructor() {
    super();
    this.type = Projectile.typeName;
    this.collisionLayer = CollisionLayer.Projectile;
    this.bounce = 0;
    this.mass = 0.03;
    this.setColor(rgba(1.0, 0.6, 0.3, 0.8));
    this.boundingBox.width = 20;
    this.boundingBox.height = 20;
  }

  public initialize(): void {
    if (!this.hasBegun) {
      this.prepareRemove();
      this.hasBegun = true;
    }
  }

  private async prepareRemove(): Promise<void> {
    await EventManager.sleep(this.duration);
    if (!this.markedForDelete) {
      this.remove();
    }
  }

  public collide(other?: Entity) {
    super.collide(other);

    if (
      other === undefined ||
      other.collisionLayer === CollisionLayer.Geometry
    ) {
      this.hit();
      this.remove();
      return;
    }

    if (other === this.parent) {
      return;
    }

    if (other instanceof Unit && NetworkManager.isServer()) {
      this.hit(other);
    }
  }

  private explodeInternal(): void {
    if (NetworkManager.isClient()) {
      this.explode();
      this.hasExploded = true;
    }
  }

  protected explode(): void {
    const echo = WorldManager.spawn(Echo, this.position);
    echo.initialize(this, false, 0.5);
    echo.velocity.zero();
  }

  public remove(showExplosion: boolean = true): void {
    if (NetworkManager.isServer()) {
      this.markForDelete();
    } else {
      this.isVisible = false;
      this.isCollidable = false;
      if (showExplosion && !this.hasExploded) {
        this.explodeInternal();
      }
    }
  }

  public hit(unit?: Unit): boolean {
    if (unit) {
      if (
        !this.hitEntities.has(unit.id) &&
        this.hitEntities.size < this.pierce
      ) {
        unit.damage(this.damage, this.parent);
        unit.applyForce(this.velocity, this.mass);
        if (this.onHit) {
          this.onHit(unit);
        }
        this.hitEntities.add(unit.id);
        if (this.hitEntities.size >= this.pierce) {
          this.remove();
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }

  public render(ctx: GraphicsContext): void {
    const { width, height } = this.boundingBox;
    ctx.ellipse(-width / 2, -height / 2, width, height, this.getColor());
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      damage: this.damage,
      parentID: this.parent?.id,
      hitEntities: iterator(this.hitEntities).toArray(),
      pierce: this.pierce,
      duration: this.duration,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const { damage, parentID, hitEntities, pierce, duration } = data;

    if (typeof duration === 'number') {
      this.duration = duration;
    }

    if (typeof damage === 'number') {
      this.damage = damage;
    }

    if (typeof pierce === 'number') {
      this.pierce = pierce;
    }

    if (typeof parentID === 'string') {
      const parent = WorldManager.getEntity(parentID);
      if (parent instanceof Unit) {
        this.parent = parent;
      }
    }

    if (hitEntities instanceof Array) {
      this.hitEntities.clear();
      hitEntities.forEach((entity) => this.hitEntities.add(entity));
    }

    if (!this.hasBegun) {
      this.initialize();
    }
  }

  public cleanup(): void {
    if (!this.hasExploded) {
      this.explodeInternal();
    }
    super.cleanup();
  }
}

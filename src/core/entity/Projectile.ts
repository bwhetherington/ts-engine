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

const log = LogManager.forFile(__filename);

const DURATION = 1.5;
const FADE_DURATION = 0.0625;

export class Projectile extends Entity {
  public static typeName: string = 'Projectile';

  public pierce: number = 1;
  public damage: number = 15;
  private hasExploded: boolean = false;
  public parent?: Unit;

  private timeElapsed: number = 0;
  private originalColor: Color = WHITE;
  private hitEntities: Set<UUID> = new Set();

  public onHit?: (target?: Unit) => void;

  constructor() {
    super();
    this.type = Projectile.typeName;
    this.bounce = 0;
    this.mass = 0.03;
    this.setOriginalColor(rgba(1.0, 0.6, 0.3, 0.8));
    this.registerListeners();
    this.prepareRemove();
    this.boundingBox.width = 15;
    this.boundingBox.height = 15;
  }

  protected setOriginalColor(color: Color): void {
    this.originalColor = color;
    this.setColor(color);
  }

  private async prepareRemove(): Promise<void> {
    await sleep(DURATION);
    if (!this.markedForDelete) {
      this.remove();
    }
  }

  private registerListeners(): void {
    this.addListener<CollisionEvent>('CollisionEvent', (event) => {
      const { collider, collided } = event.data;
      if (collider === this) {
        if (
          collided === undefined ||
          collided.collisionLayer === CollisionLayer.Geometry
        ) {
          this.hit();
          this.remove();
          return;
        }

        if (collided === this.parent) {
          return;
        }

        if (collided instanceof Unit && NetworkManager.isServer()) {
          this.hit(collided);
        }
      }
    });
  }

  private explodeInternal(): void {
    if (NetworkManager.isClient()) {
      this.explode();
      this.hasExploded = true;
    }
  }

  public step(dt: number): void {
    super.step(dt);
    this.timeElapsed += dt;
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
      if (!this.hitEntities.has(unit.id) && this.hitEntities.size < this.pierce) {
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
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const { damage, parentID, hitEntities, pierce } = data;

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
  }

  public cleanup(): void {
    if (!this.hasExploded) {
      this.explodeInternal();
    }
    super.cleanup();
  }
}

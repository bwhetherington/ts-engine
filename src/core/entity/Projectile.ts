import { Entity, CollisionEvent, Unit, WorldManager } from 'core/entity';
import { GraphicsContext } from 'core/graphics';
import { LogManager } from 'core/log';
import { CollisionLayer } from './util';
import { Data } from 'core/serialize';
import { NetworkManager } from 'core/net';
import { Explosion } from './Explosion';

const log = LogManager.forFile(__filename);

export class Projectile extends Entity {
  public static typeName: string = 'Projectile';

  public damage: number = 15;
  private hasExploded: boolean = false;
  public parent?: Unit;

  public onHit?: (target?: Unit) => void;

  constructor() {
    super();
    this.type = Projectile.typeName;
    this.bounce = 1;
    this.setColor({
      red: 1.0,
      green: 0.6,
      blue: 0.3,
      alpha: 0.8,
    });
    this.registerListeners();
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

        if (collided instanceof Unit) {
          this.hit(collided);
          this.remove();
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

  protected explode(): void {
    const explosion = new Explosion();
    explosion.radius = 20;
    explosion.setPosition(this.position);
    explosion.setColor(this.getColor());
    WorldManager.add(explosion);
  }

  public remove(): void {
    if (NetworkManager.isServer()) {
      this.markForDelete();
    } else {
      this.isVisible = false;
      this.isCollidable = false;
      if (!this.hasExploded) {
        this.explodeInternal();
      }
    }
  }

  public hit(unit?: Unit): void {
    if (unit) {
      unit.damage(this.damage, this.parent);
      unit.applyForce(this.velocity, this.mass);
    }
    if (this.onHit) {
      this.onHit(unit);
    }
  }

  public render(ctx: GraphicsContext): void {
    const { x, y, width, height } = this.boundingBox;
    ctx.ellipse(x, y, width, height, this.getColor());
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      damage: this.damage,
      parentID: this.parent?.id,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const { damage, parentID } = data;

    if (typeof damage === 'number') {
      this.damage = damage;
    }

    if (typeof parentID === 'string') {
      const parent = WorldManager.getEntity(parentID);
      if (parent instanceof Unit) {
        this.parent = parent;
      }
    }
  }

  public cleanup(): void {
    if (!this.hasExploded) {
      this.explodeInternal();
    }
    super.cleanup();
  }
}
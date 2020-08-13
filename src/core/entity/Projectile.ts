import { Entity, CollisionEvent, Unit, WM } from 'core/entity';
import { GraphicsContext } from 'core/graphics';
import { LM } from 'core/log';
import { CollisionLayer, DamageEvent } from './util';
import { Data } from 'core/serialize';
import { NM } from 'core/net';
import { Explosion } from './Explosion';

const log = LM.forFile(__filename);

export class Projectile extends Entity {
  public static typeName: string = 'Projectile';

  public damage: number = 15;
  private hasExploded: boolean = false;
  public parent?: Unit;

  constructor() {
    super();
    this.type = Projectile.typeName;
    this.bounce = 1;
    this.color = {
      red: 1.0,
      green: 0.6,
      blue: 0.3,
      alpha: 0.8,
    };
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
          this.remove();
          return;
        }

        if (collided === this.parent) {
          return;
        }

        if (collided instanceof Unit && this.parent?.id !== collided.id) {
          this.hit(collided);
          this.remove();
        }
      }
    });
  }

  private explode(): void {
    if (NM.isClient()) {
      const explosion = new Explosion();
      explosion.setPosition(this.position);
      explosion.color = this.color;
      WM.add(explosion);
      this.hasExploded = true;
    }
  }

  public remove(): void {
    if (NM.isServer()) {
      this.markForDelete();
    } else {
      this.isVisible = false;
      this.isCollidable = false;
      if (!this.hasExploded) {
        this.explode();
      }
    }
  }

  public hit(unit: Unit): void {
    log.debug(`${this.toString()} hit ${unit.toString()}`);
    unit.damage(this.damage, this.parent);
    unit.applyForce(this.velocity, this.mass);
  }

  public render(ctx: GraphicsContext): void {
    const { x, y, width, height } = this.boundingBox;
    ctx.ellipse(x, y, width, height, this.color);
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
      const parent = WM.getEntity(parentID);
      if (parent instanceof Unit) {
        this.parent = parent;
      }
    }
  }

  public cleanup(): void {
    if (!this.hasExploded) {
      this.explode();
    }
    super.cleanup();
  }
}

import { Entity, CollisionEvent, Unit, WM } from 'core/entity';
import { GraphicsContext } from 'core/graphics';
import { LM } from 'core/log';
import { CollisionLayer } from './util';
import { Data } from 'core/serialize';
import { NM } from 'core/net';
import { Explosion } from './Explosion';

export class Projectile extends Entity {
  public static typeName: string = 'Projectile';

  public damage: number = 15;

  constructor() {
    super();
    this.type = Projectile.typeName;
    this.bounce = 1;
    this.registerListeners();
  }

  private registerListeners(): void {
    this.addListener<CollisionEvent>('CollisionEvent', (event) => {
      const { collider, collided } = event.data;
      if (collider === this) {
        if (collided === undefined || collided.collisionLayer === CollisionLayer.Geometry) {
          this.remove();
        }
        if (collided instanceof Unit) {
          collided.damage(this.damage);
          this.remove();
        }
      }
    });
  }

  public remove(): void {
    if (NM.isServer()) {
      this.markForDelete();
    } else {
      this.isVisible = false;
      this.isCollidable = false;
    }
  }

  public hit(entity: Entity): void {
    LM.debug(`${this.id} hit ${entity.id}`);
  }

  public render(ctx: GraphicsContext): void {
    const { x, y, width, height } = this.boundingBox;
    ctx.ellipse(x, y, width, height, this.color);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      damage: this.damage,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const { damage } = data;
    if (typeof damage === 'number') {
      this.damage = damage;
    }
  }

  public cleanup(): void {
    if (NM.isClient()) {
      const explosion = new Explosion();
      explosion.setPosition(this.position);
      WM.add(explosion);
    }
    super.cleanup();
  }
}
import { Entity, CollisionEvent, Unit, WorldManager } from 'core/entity';
import { GraphicsContext, Color, rgb, rgba } from 'core/graphics';
import { LogManager } from 'core/log';
import { CollisionLayer } from './util';
import { Data } from 'core/serialize';
import { NetworkManager } from 'core/net';
import { Explosion } from './Explosion';
import { sleep, clamp } from 'core/util';
import { WHITE } from 'core/graphics/color';

const log = LogManager.forFile(__filename);

const DURATION = 1.5;
const FADE_DURATION = 0.125;

export class Projectile extends Entity {
  public static typeName: string = 'Projectile';

  public damage: number = 15;
  private hasExploded: boolean = false;
  public parent?: Unit;

  private timeElapsed: number = 0;
  private originalColor: Color = WHITE;

  public onHit?: (target?: Unit) => void;

  constructor() {
    super();
    this.type = Projectile.typeName;
    this.bounce = 1;
    this.setOriginalColor(rgba(1.0, 0.6, 0.3, 0.8));
    this.registerListeners();
    this.prepareRemove();
    this.boundingBox.width = 20;
    this.boundingBox.height = 20;
  }

  protected setOriginalColor(color: Color): void {
    this.originalColor = color;
    this.setColor(color);
  }

  private getFadeParameter(): number {
    // Begin to fade halfway through the projectile life
    const fadePeriod = FADE_DURATION / DURATION;
    const multiplier = 1 / fadePeriod;

    const t = clamp(
      (this.timeElapsed / DURATION + fadePeriod - 1) * multiplier,
      0,
      1
    );
    return Math.min(1, t);
  }

  private async prepareRemove(): Promise<void> {
    await sleep(DURATION);
    if (!this.markedForDelete) {
      this.hasExploded = true;
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

  public step(dt: number): void {
    super.step(dt);
    this.timeElapsed += dt;
    const t = this.getFadeParameter();

    // Calculate intermediate color
    if (t > 0) {
      const { red, green, blue, alpha = 1 } = this.originalColor;
      const newAlpha = alpha * (1 - t);
      this.setColor(rgba(red, green, blue, newAlpha));
    }
  }

  protected explode(): void {
    const explosion = new Explosion();
    explosion.radius = 20;
    explosion.setPosition(this.position);
    explosion.setColor(this.originalColor);
    WorldManager.add(explosion);
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

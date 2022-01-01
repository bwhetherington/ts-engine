import {EffectManager} from 'core/effect';
import {Entity, Unit, WorldManager, CollisionLayer} from 'core/entity';
import {EventManager} from 'core/event';
import {GraphicsContext} from 'core/graphics';
import {Data} from 'core/serialize';
import {Iterator} from 'core/iterator';
import {NetworkManager} from 'core/net';

const AURA_WIDTH = 40;
const AURA_INTERVAL = 0.25;

export class Aura extends Entity {
  public static typeName: string = 'Aura';

  public effect?: string;

  private counter: number = 0;
  private _radius: number = 50;

  constructor() {
    super();
    this.collisionLayer = CollisionLayer.Aura;
    this.radius = 150;
    this.isCollidable = false;
    this.isSpatial = false;
    this.counter = EventManager.timeElapsed % AURA_INTERVAL;
  }

  public get radius() {
    return this._radius;
  }

  public set radius(val) {
    this._radius = val;
    this.boundingBox.width = 2 * val;
    this.boundingBox.height = 2 * val;
  }

  private get parent() {
    if (this.attachedTo instanceof Unit) {
      return this.attachedTo;
    }
  }

  private getTargets(): Iterator<Unit> {
    return WorldManager.query(this.boundingBox)
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .filter((unit) => {
        // Exclude owner from targets
        if (unit === this.parent) {
          return false;
        }
        // Verify that they are within the radius
        if (
          unit.position.distanceToXYSquared(this.position.x, this.position.y) >
          this.radius * this.radius
        ) {
          return false;
        }
        return true;
      });
  }

  private applyEffect(target: Unit) {
    if (!this.effect) {
      return;
    }
    const effect = EffectManager.instantiate(this.effect);
    if (!effect) {
      return;
    }
    effect.source = this.parent;
    effect.duration = AURA_INTERVAL;
    target.addEffect(effect);
  }

  public override step(dt: number) {
    super.step(dt);
    if (NetworkManager.isServer()) {
      this.counter += dt;
      if (this.counter >= AURA_INTERVAL) {
        this.counter %= AURA_INTERVAL;
        this.getTargets().forEach((unit) => this.applyEffect(unit));
      }
    }
  }

  public initialize(unit: Unit) {
    this.attachTo(unit);
    this.setPosition(unit.position);
    unit.addAura(this);
  }

  public render(ctx: GraphicsContext) {
    const {parent} = this;
    if (!parent) {
      return;
    }

    const color = {...parent.getBaseColor(), alpha: 0.5};
    const center = {...color, alpha: 0};
    ctx.gradientCircle(
      0,
      0,
      Math.max(this.radius - AURA_WIDTH, 0),
      this.radius,
      center,
      color
    );
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      effect: this.effect,
      radius: this.radius,
    };
  }

  public override deserialize(data: Data, setInitialized?: boolean): void {
    super.deserialize(data, setInitialized);
    const {effect, radius} = data;
    if (typeof effect === 'string') {
      this.effect = effect;
    }
    if (typeof radius === 'number') {
      this.radius = radius;
    }
  }

  public override cleanup() {
    super.cleanup();
    this.parent?.removeAura(this);
  }
}

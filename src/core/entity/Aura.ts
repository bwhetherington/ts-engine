import {Effect, EffectManager} from '@/core/effect';
import {Entity, Unit, WorldManager, CollisionLayer} from '@/core/entity';
import {GraphicsContext} from '@/core/graphics';
import {Data} from '@/core/serialize';
import {Iterator} from '@/core/iterator';
import {NetworkManager} from '@/core/net';
import {AssetIdentifier, isAssetIdentifier} from '@/core/assets';
import {UUID} from '@/core/uuid';

const AURA_WIDTH = 40;

export class Aura extends Entity {
  public static override typeName: string = 'Aura';

  public effect?: AssetIdentifier;
  public targetHostile: boolean = true;

  private _radius: number = 50;
  private activeEffects: Map<UUID, Effect> = new Map();

  constructor() {
    super();
    this.collisionLayer = CollisionLayer.Aura;
    this.radius = 150;
    this.isCollidable = false;
    this.isSpatial = false;
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

        // Choose correct team to target
        if (this.targetHostile && !this.parent?.isHostileTo(unit)) {
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

  private applyEffect(target: Unit): Effect | undefined {
    if (!this.effect) {
      return;
    }
    const effect = EffectManager.instantiate(this.effect);
    if (!effect) {
      return;
    }
    effect.source = this.parent;
    delete effect.duration;
    target.addEffect(effect);
    return effect;
  }

  public override step(dt: number) {
    super.step(dt);
    if (NetworkManager.isServer()) {
      const targets = new Map(this.getTargets().map((unit) => [unit.id, unit]));

      // Check for new entities
      for (const target of targets.values()) {
        // Triger on enter if a new target is found
        if (!this.activeEffects.has(target.id)) {
          this.onUnitEnter(target);
        }
      }

      // Check for entities which may no longer be in radius
      for (const existing of this.activeEffects.keys()) {
        // Trigger on leave if a target is not found among the existing targets
        if (!targets.has(existing)) {
          const entity = WorldManager.getEntity(existing);
          if (entity instanceof Unit) {
            this.onUnitLeave(entity);
          }
        }
      }
    }
  }

  public initialize(unit: Unit) {
    this.attachTo(unit);
    this.setPosition(unit.position);
    unit.addAura(this);
  }

  private onUnitEnter(unit: Unit) {
    const effect = this.applyEffect(unit);
    if (effect) {
      this.activeEffects.set(unit.id, effect);
    }
  }

  private onUnitLeave(unit: Unit) {
    const effect = this.activeEffects.get(unit.id);
    if (!effect) {
      return;
    }
    unit.removeEffect(effect);
    this.activeEffects.delete(unit.id);
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
      targetHostile: this.targetHostile,
      radius: this.radius,
    };
  }

  public override deserialize(data: Data, setInitialized?: boolean): void {
    super.deserialize(data, setInitialized);
    const {effect, targetHostile, radius} = data;
    if (isAssetIdentifier(effect)) {
      this.effect = effect;
    }
    if (typeof targetHostile === 'boolean') {
      this.targetHostile = targetHostile;
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

import {Weapon} from '@/core/weapon';
import {
  WorldManager,
  Tank,
  Entity,
  Unit,
  DisplayRayEvent,
  DamageType,
} from '@/core/entity';
import {Iterator} from '@/core/iterator';
import {EventManager, Event} from '@/core/event';
import {NetworkManager} from '@/core/net';
import {Data} from '@/core/serialize';
import {HeroModifier} from '@/core/upgrade';
import {DotEffect, EffectManager} from '../effect';

export class BaseRaygun extends Weapon {
  public static typeName: string = 'BaseRaygun';
  private rayDistance: number = 1000;

  public constructor() {
    super();
    this.rate = 0.25;
    this.damage = 5;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      rayDistance: this.rayDistance,
    };
  }

  public deserialize(data: Data) {
    super.deserialize(data);
    const {rayDistance} = data;
    if (typeof rayDistance === 'number') {
      this.rayDistance = rayDistance;
    }
  }

  protected override getShotCount(_modifier?: HeroModifier): number {
    return 1;
  }

  private getShotScaling(modifiers: HeroModifier, decay: number): number {
    const numShots = super.getShotCount(modifiers);
    return Math.max(1, 1 + (numShots - 1) / decay);
  }

  protected override getDamage(modifiers: HeroModifier): number {
    return this.getShotScaling(modifiers, 1) * super.getDamage(modifiers);
  }

  public fire(source: Tank, angle: number) {
    const start = source.getCannonTip();
    const set: Set<Entity> = new Set();
    set.add(source);

    const width = this.getShotScaling(source.modifiers, 4);

    const {hit, end} = WorldManager.castRay(
      start,
      angle,
      this.rayDistance,
      this.pierce,
      width * 8,
      (entity: Entity) => entity instanceof Unit && entity !== source
    );

    const damage = this.getDamage(source.modifiers);
    Iterator.from(hit)
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .forEach((unit) => {
        this.onHit(source, unit);
        unit.damage(damage, DamageType.Energy, source);
      });

    const event: Event<DisplayRayEvent> = {
      type: 'DisplayRayEvent',
      data: {
        start: {x: start.x, y: start.y},
        stop: {x: end.x, y: end.y},
        sourceID: source.id,
        width,
      },
    };
    if (NetworkManager.isServer()) {
      NetworkManager.sendEvent<DisplayRayEvent>(event);
    }
    if (NetworkManager.isClient()) {
      EventManager.emit<DisplayRayEvent>(event);
    }
  }

  protected override onHit(source: Tank, unit?: Unit) {
    super.onHit(source, unit);

    if (!unit) {
      return;
    }

    // Apply burning effect that scales with damage
    const burn = EffectManager.instantiate('BurnEffect') as DotEffect;
    burn.damage = this.getDamage(source.modifiers) / 15;
    burn.duration = 4;
    burn.source = source;
    unit.addEffect(burn);
  }
}

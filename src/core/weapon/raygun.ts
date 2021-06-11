import {Weapon} from 'core/weapon';
import {
  WorldManager,
  Ray,
  Tank,
  Entity,
  Unit,
  DisplayRayEvent,
} from 'core/entity';
import {Iterator, iterator} from 'core/iterator';
import {EventManager} from 'core/event';
import {Color} from 'core/graphics/color';
import {NetworkManager} from 'core/net';
import {RNGManager} from 'core/random';
import {Data} from 'core/serialize';
import {HeroModifier} from 'core/upgrade';

const COLOR: Color = {
  red: 0.8,
  green: 0.1,
  blue: 0.1,
  alpha: 0.75,
};

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

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {rayDistance} = data;
    if (typeof rayDistance === 'number') {
      this.rayDistance = rayDistance;
    }
  }

  public fire(source: Tank, angle: number, modifier?: HeroModifier): void {
    const start = source.getCannonTip();
    const set: Set<Entity> = new Set();
    set.add(source);
    const {hit, end} = WorldManager.castRay(
      start,
      angle,
      this.rayDistance,
      this.pierce,
      (entity: Entity) => entity instanceof Unit && entity !== source
    );

    const damage = this.rollDamage(modifier);
    Iterator.from(hit)
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .forEach((unit) => unit.damage(damage, source));

    const event = {
      type: 'DisplayRayEvent',
      data: {
        start: {x: start.x, y: start.y},
        stop: {x: end.x, y: end.y},
        sourceID: source.id,
      },
    };
    if (NetworkManager.isServer()) {
      NetworkManager.sendEvent<DisplayRayEvent>(event);
    }
    if (NetworkManager.isClient()) {
      EventManager.emit<DisplayRayEvent>(event);
    }
  }
}

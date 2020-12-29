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
import { Data } from 'core/serialize';

const COLOR: Color = {
  red: 0.8,
  green: 0.1,
  blue: 0.1,
  alpha: 0.75,
};

export class BaseRayGun extends Weapon {
  public static typeName: string = 'BaseRayGun';

  private raySpread: number = 0.05;
  private rayPierce: number = 1;
  private rayDistance: number = 1000;

  public constructor() {
    super();
    this.type = BaseRayGun.typeName;
    this.rate = 0.25;
    this.damage = 5;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      raySpread: this.raySpread,
      rayPierce: this.rayPierce,
      rayDistance: this.rayDistance,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {raySpread, rayPierce, rayDistance} = data;
    if (typeof raySpread === 'number') {
      this.raySpread = raySpread;
    }
    if (typeof rayPierce === 'number') {
      this.rayPierce = rayPierce;
    }
    if (typeof rayDistance === 'number') {
      this.rayDistance = rayDistance;
    }
  }

  public fire(source: Tank, angle: number): void {
    angle += RNGManager.nextFloat(-0.5, 0.5) * this.raySpread;

    const start = source.getCannonTip();
    const set: Set<Entity> = new Set();
    set.add(source);
    const {hit, end} = WorldManager.castRay(
      start,
      angle,
      this.rayDistance,
      this.rayPierce,
      (entity: Entity) => entity instanceof Unit && entity !== source
    );
    Iterator.from(hit)
      .filterMap((entity: Entity) =>
        entity instanceof Unit ? entity : undefined
      )
      .forEach((unit: Unit) => unit.damage(this.rollDamage(), source));

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
    } else {
      EventManager.emit<DisplayRayEvent>(event);
    }
  }
}

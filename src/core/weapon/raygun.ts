import {Weapon} from 'core/weapon';
import {
  WorldManager,
  Ray,
  Tank,
  Entity,
  Unit,
  DisplayRayEvent,
} from 'core/entity';
import {iterator} from 'core/iterator';
import {EventManager} from 'core/event';
import {BLACK, Color, reshade} from 'core/graphics/color';
import {NetworkManager} from 'core/net';
import {RNGManager} from 'core/random';

const COLOR: Color = {
  red: 0.8,
  green: 0.1,
  blue: 0.1,
  alpha: 0.75,
};

export class RayGun extends Weapon {
  public static typeName: string = 'RayGun';

  public constructor() {
    super();
    this.type = RayGun.typeName;
    this.rate = 0.25;
    this.damage = 15;
  }

  public fire(source: Tank, angle: number): void {
    angle += RNGManager.nextFloat(-0.5, 0.5) * 0.05;

    const start = source.getCannonTip();
    const set: Set<Entity> = new Set();
    set.add(source);
    const {hit, end} = WorldManager.castRay(
      start,
      angle,
      1000,
      1,
      (entity: Entity) => entity instanceof Unit && entity !== source
    );
    iterator(hit)
      .filterMap((entity: Entity) =>
        entity instanceof Unit ? entity : undefined
      )
      .forEach((unit: Unit) => unit.damage(this.rollDamage(), source));

    const color = reshade(source.getBaseColor());
    color.alpha = (color.alpha ?? 1) * (2 / 3);

    const event = {
      type: 'DisplayRayEvent',
      data: {
        start: {x: start.x, y: start.y},
        stop: {x: end.x, y: end.y},
        color,
      },
    };
    if (NetworkManager.isServer()) {
      NetworkManager.send(event);
    } else {
      EventManager.emit<DisplayRayEvent>(event);
    }
  }
}

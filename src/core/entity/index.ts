export { Entity, Uuid } from 'core/entity/Entity';
export { Unit } from 'core/entity/Unit';
export { Hero } from 'core/entity/Hero';
export { Geometry } from 'core/entity/Geometry';
export { Projectile } from 'core/entity/Projectile';
export { Explosion } from 'core/entity/Explosion';
export { Text } from 'core/entity/Text';

import { WorldManager } from 'core/entity/manager';
import { Rectangle } from 'core/geometry';

export {
  CollisionLayer,
  isCollisionLayer,
  shuntOutOf,
  CollisionEvent,
  DamageEvent,
} from 'core/entity/util';

const WM = new WorldManager(new Rectangle(1000, 1000, -500, -500));
export { WM as WorldManager };

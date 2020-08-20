export { Entity } from 'core/entity/Entity';
export { Unit } from 'core/entity/Unit';
export { Tank } from 'core/entity/Tank';
export { Hero } from 'core/entity/Hero';
export { Heavy } from 'core/entity/Heavy';
export { Enemy } from 'core/entity/Enemy';
export { Geometry } from 'core/entity/Geometry';
export { Projectile } from 'core/entity/Projectile';
export { BombProjectile } from 'core/entity/BombProjectile';
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
  KillEvent,
} from 'core/entity/util';

const WM = new WorldManager(new Rectangle(1000, 1000, -500, -500));
export { WM as WorldManager };

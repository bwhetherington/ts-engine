export * from '@/core/entity/damage';
export * from '@/core/entity/Entity';
export * from '@/core/entity/Unit';
export * from '@/core/entity/Tank';
export * from '@/core/entity/BaseHero';
export * from '@/core/entity/BaseEnemy';
export * from '@/core/entity/Geometry';
export * from '@/core/entity/Projectile';
export * from '@/core/entity/HomingProjectile';
export * from '@/core/entity/ShatterProjectile';
export * from '@/core/entity/Explosion';
export * from '@/core/entity/Ray';
export * from '@/core/entity/Text';
export * from '@/core/entity/TimedText';
export * from '@/core/entity/Bar';
export * from '@/core/entity/Echo';
export * from '@/core/entity/Feed';
export * from '@/core/entity/Trail';
export * from '@/core/entity/Follow';
export * from '@/core/entity/Pickup';
export * from '@/core/entity/UpgradePickup';
export * from '@/core/entity/Aura';
export * from '@/core/entity/FlameProjectile';

import {WorldManager} from '@/core/entity/manager';
import {Rectangle} from '@/core/geometry';

export * from '@/core/entity/util';

const WM = new WorldManager(new Rectangle(1000, 1000, -500, -500));
export {WM as WorldManager};

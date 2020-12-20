export * from 'core/entity/Entity';
export * from 'core/entity/Unit';
export * from 'core/entity/Tank';
export * from 'core/entity/Hero';
export * from 'core/entity/Heavy';
export * from 'core/entity/Enemy';
export * from 'core/entity/HomingEnemy';
export * from 'core/entity/Geometry';
export * from 'core/entity/Projectile';
export * from 'core/entity/HomingProjectile';
export * from 'core/entity/Explosion';
export * from 'core/entity/Ray';
export * from 'core/entity/Text';
export * from 'core/entity/TimedText';
export * from 'core/entity/Bar';
export * from 'core/entity/Echo';
export * from 'core/entity/Feed';

import {WorldManager} from 'core/entity/manager';
import {Rectangle} from 'core/geometry';

export * from 'core/entity/util';

const WM = new WorldManager(new Rectangle(1000, 1000, -500, -500));
export {WM as WorldManager};

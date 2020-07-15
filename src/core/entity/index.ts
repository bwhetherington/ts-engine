import { Entity, Uuid } from 'core/entity/Entity';
import { WorldManager } from 'core/entity/WorldManager';
import {
  CollisionLayer,
  isCollisionLayer,
  shuntOutOf,
  CollisionEvent,
} from 'core/entity/util';

import { Rectangle } from 'core/geometry';

export const WM = new WorldManager(new Rectangle(800, 600, -400, -300));
export {
  Entity,
  Uuid,
  CollisionLayer,
  CollisionEvent,
  isCollisionLayer,
  shuntOutOf,
};

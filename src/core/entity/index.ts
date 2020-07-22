import { Entity, Uuid } from 'core/entity/Entity';
import { WorldManager } from 'core/entity/WorldManager';
import {
  CollisionLayer,
  isCollisionLayer,
  shuntOutOf,
  CollisionEvent,
} from 'core/entity/util';
import { Unit } from 'core/entity/Unit';
import { Hero } from 'core/entity/Hero';
import { Geometry } from 'core/entity/Geometry';

import { Rectangle } from 'core/geometry';

export const WM = new WorldManager(new Rectangle(1000, 1000, -500, -500));
export {
  Entity,
  Uuid,
  CollisionLayer,
  CollisionEvent,
  Unit,
  Hero,
  Geometry,
  isCollisionLayer,
  shuntOutOf,
};

import {Entity, Unit} from '@/core/entity';
import {Rectangle, Vector, VectorLike} from '@/core/geometry';
import {UUID} from '@/core/uuid';

import {makeEventType} from '../event';

export interface SpawnEntityEvent {
  entity: Entity;
}
export const SpawnEntityEvent =
  makeEventType<SpawnEntityEvent>('SpawnEntityEvent');

export enum CollisionLayer {
  Geometry = 0,
  Aura = 1,
  BaseEffect = 2,
  Unit = 3,
  Projectile = 4,
  Effect = 5,
  HUD = 6,
}

export function isCollisionLayer(input: any): input is CollisionLayer {
  return CollisionLayer.hasOwnProperty(input);
}

export interface CollisionEvent {
  collider: Entity;
  collided?: Entity;
}
export const CollisionEvent = makeEventType<CollisionEvent>('CollisionEvent');

export function shuntOutOf(entity: Entity, other: Rectangle) {
  const box = entity.boundingBox;
  const {centerX: x, centerY: y} = box;

  // Check if contained entirely within the rectangle
  if (other.contains(box)) {
    // Push out to nearest side
    const left = box.x - other.x;
    const right = other.farX - box.farX;
    const top = box.x - other.x;
    const bottom = other.farY - box.farY;

    // Find closest of them
    const min = Math.min(left, right, top, bottom);
    switch (min) {
      case left:
        entity.addPositionXY(other.x - box.farX, 0);
        break;
      case right:
        entity.addPositionXY(other.farX - box.x, 0);
        break;
      case top:
        entity.addPositionXY(0, other.y - box.farY);
        break;
      case bottom:
        entity.addPositionXY(0, other.farY - box.y);
        break;
    }
    return;
  }

  const x1 = box.x;
  const x2 = box.farX;
  const y1 = box.y;
  const y2 = box.farY;

  const ox1 = other.x;
  const ox2 = other.farX;
  const oy1 = other.y;
  const oy2 = other.farY;

  let dx = 0;
  let dy = 0;

  let xAxis = 0;
  let yAxis = 0;

  if (x2 > ox2 && x1 < ox2) {
    dx += ox2 - x1;
    xAxis = 1;
  }

  if (x1 < ox1 && x2 > ox1) {
    dx += ox1 - x2;
    xAxis = -1;
  }

  if (y2 > oy2 && y1 < oy2) {
    dy += oy2 - y1;
    yAxis = 1;
  }

  if (y1 < oy1 && y2 > oy1) {
    dy += oy1 - y2;
    yAxis = -1;
  }

  if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
    // Get the closest corner to the collision
    const cx = other.centerX;
    const cy = other.centerY;
    const hw = other.width / 2;
    const hh = other.height / 2;
    const cornerX = cx + xAxis * hw;
    const cornerY = cy + yAxis * hh;

    const thisCornerX = x - xAxis * (box.width / 2);
    const thisCornerY = y - yAxis * (box.height / 2);

    // Check quadrant
    const cornerDX = Math.abs(cornerX - thisCornerX);
    const cornerDY = Math.abs(cornerY - thisCornerY);
    if (cornerDX > cornerDY) {
      dx = 0;
    } else if (cornerDX < cornerDY) {
      dy = 0;
    }
  }

  if (Math.abs(dx) > 0 && Math.sign(dx) === xAxis) {
    entity.velocity.x *= -entity.bounce;
  }

  if (Math.abs(dy) > 0 && Math.sign(dy) === yAxis) {
    entity.velocity.y *= -entity.bounce;
  }

  entity.addPositionXY(dx, dy);
}

export interface DamageEvent {
  targetID: UUID;
  sourceID?: UUID;
  amount: number;
}
export const DamageEvent = makeEventType<DamageEvent>('DamageEvent');

export interface KillEvent {
  targetID: UUID;
  target?: Unit;
  sourceID?: UUID;
  source?: Unit;
}
export const KillEvent = makeEventType<KillEvent>('KillEvent');

export interface RayCastResult {
  hit: Set<Entity>;
  end: Vector;
}

export interface DisplayRayEvent {
  start: VectorLike;
  stop: VectorLike;
  sourceID: UUID;
  width: number;
}
export const DisplayRayEvent =
  makeEventType<DisplayRayEvent>('DisplayRayEvent');

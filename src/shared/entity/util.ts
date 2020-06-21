import Entity from "./Entity";
import Rectangle from "../util/rectangle";
import LM from "../util/LogManager";
import { BLACK } from "../util/color";

export type CollisionLayer = "geometry" | "unit";

export interface CollisionEvent {
  collider: Entity;
  collided: Entity;
}

export function shuntOutOf(entity: Entity, other: Rectangle) {
  const box = entity.boundingBox;
  const { centerX: x, centerY: y } = box;

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

  if (Math.abs(dx) > 0) {
    entity.velocity.x = -1 * entity.velocity.x;
  }

  if (Math.abs(dy) > 0) {
    entity.velocity.y = -1 * entity.velocity.y;
  }

  entity.addPositionXY(dx, dy);
}

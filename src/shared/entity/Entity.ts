import { Bounded } from "../util/quadtree";
import Rectangle from "../util/rectangle";
import Vector from "../util/vector";
import { GraphicsContext } from "../graphics/util";
import { WHITE, Color } from "../util/color";
import { v1 as genUuid } from "uuid";
import { CollisionLayer } from "./util";

type Uuid = string;

class Entity implements Bounded {
  public boundingBox: Rectangle = new Rectangle(10, 10, 0, 0);
  public position: Vector = new Vector(0, 0);
  public velocity: Vector = new Vector(0, 0);
  public id: Uuid;
  public color: Color = WHITE;
  public collisionLayer: CollisionLayer = "unit";

  constructor() {
    this.id = genUuid();
  }

  public setPosition(point: Vector): void {
    this.setPositionXY(point.x, point.y);
  }

  public setPositionXY(x: number, y: number): void {
    this.position.setXY(x, y);
    this.updateBoundingBox();
  }

  public addPosition(diff: Vector, scale: number = 1): void {
    this.addPositionXY(diff.x, diff.y, scale);
  }

  public addPositionXY(dx: number, dy: number, scale: number = 1): void {
    this.position.addXY(dx, dy, scale);
    this.updateBoundingBox();
  }

  public render(ctx: GraphicsContext): void {
    const { x, y, width, height } = this.boundingBox;
    ctx.rect(x, y, width, height, this.color);
  }

  private updateBoundingBox(): void {
    this.boundingBox.x = this.position.x;
    this.boundingBox.y = this.position.y;
  }

  private updatePosition(dt: number): void {
    this.addPosition(this.velocity, dt);
  }

  public step(dt: number): void {
    this.updatePosition(dt);
  }
}

export default Entity;

import { Bounded } from "../util/quadtree";
import Rectangle from "../util/rectangle";
import Vector from "../util/vector";
import { GraphicsContext } from "../graphics/util";
import { WHITE, Color } from "../util/color";
import { v1 as genUuid } from "uuid";

type Uuid = string;

class Entity implements Bounded {
  public boundingBox: Rectangle = new Rectangle(10, 10, 0, 0);
  public position: Vector = new Vector(0, 0);
  public velocity: Vector = new Vector(0, 0);
  public id: Uuid;
  public color: Color = WHITE;

  constructor() {
    this.id = genUuid();
  }

  public setPosition(point: Vector): void {
    this.position.set(point);
  }

  public render(ctx: GraphicsContext) {
    const { x, y, width, height } = this.boundingBox;
    ctx.rect(x, y, width, height, this.color);
  }

  private updatePosition(dt: number): void {
    this.position.add(this.velocity, dt);
    this.boundingBox.x = this.position.x;
    this.boundingBox.y = this.position.y;
  }

  public step(dt: number): void {
    this.updatePosition(dt);
  }
}

export default Entity;
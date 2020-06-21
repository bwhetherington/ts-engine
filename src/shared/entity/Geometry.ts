import Entity from "./Entity";
import Rectangle from "../util/rectangle";
import { GraphicsContext } from "../graphics/util";

class Geometry extends Entity {
  public constructor(rect: Rectangle) {
    super();
    this.boundingBox = rect;
    this.setPositionXY(rect.x, rect.y);
    this.collisionLayer = "geometry";
  }

  // public render(ctx: GraphicsContext): void {
  //   const { x, y, width, height } = this.boundingBox;
  //   ctx.rect(x, y, width, height, this.color);
  // }
}

export default Geometry;

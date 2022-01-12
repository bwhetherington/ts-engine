import {Bounded, Rectangle, VectorLike} from '@/core/geometry';
import {GraphicsContext, Renderable} from '@/core/graphics';

export abstract class Partioner<T extends Bounded>
  implements Bounded, Renderable
{
  public constructor(public boundingBox: Rectangle) {}

  public abstract render(ctx: GraphicsContext): void;
  public abstract resize(bounds: Rectangle): void;
  public abstract insert(element: T): void;
  public abstract query(area: Rectangle): Set<T>;
  public queryPoint(pt: VectorLike): Set<T> {
    return this.queryPointXY(pt.x, pt.y);
  }
  public abstract queryPointXY(x: number, y: number): Set<T>;
  public abstract clear(): void;
  public abstract getSize(): number;
}

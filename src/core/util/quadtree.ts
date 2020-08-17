import { Rectangle } from 'core/geometry';
import { GraphicsContext, Renderable } from 'core/graphics';
import { WHITE } from 'core/graphics/color';

const NODE_POSITION = {
  TOP_LEFT: 0,
  TOP_RIGHT: 1,
  BOTTOM_LEFT: 2,
  BOTTOM_RIGHT: 3,
};

export interface Bounded {
  boundingBox: Rectangle;
}

function calculateMaxDepth(size: number): number {
  return Math.floor(Math.log(size) / (2 * Math.log(2)));
}

class QuadNode<T extends Bounded> implements Bounded, Renderable {
  public boundingBox: Rectangle;
  public children: T[] = [];
  public nodes: QuadNode<T>[] = [];
  public maxChildren: number;
  public maxDepth: number;
  public depth: number;

  constructor(
    boundingBox: Rectangle,
    depth: number = 0,
    maxDepth: number = 4,
    maxChildren: number = 4
  ) {
    this.boundingBox = boundingBox;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.maxChildren = maxChildren;
  }

  public render(ctx: GraphicsContext): void {
    const { x, y, width, height } = this.boundingBox;
    ctx.rect(x, y, width, height, WHITE);
    for (const childNode of this.nodes) {
      childNode.render(ctx);
    }
  }

  public clear(): void {
    this.children = [];
    for (const childNode of this.nodes) {
      childNode.clear();
    }
    this.nodes = [];
  }

  private *findIndices(rect: Rectangle): Generator<number> {
    const { x, y, farX, farY } = rect;
    const { centerX, centerY } = this.boundingBox;

    if (x < centerX && y < centerY) {
      yield NODE_POSITION.TOP_LEFT;
    }
    if (farX > centerX && y < centerY) {
      yield NODE_POSITION.TOP_RIGHT;
    }
    if (x < centerX && farY > centerY) {
      yield NODE_POSITION.BOTTOM_LEFT;
    }
    if (farX > centerX && farY > centerY) {
      yield NODE_POSITION.BOTTOM_RIGHT;
    }
  }

  public insert(element: T) {
    if (this.nodes.length === 0) {
      this.children.push(element);
      if (
        this.depth < this.maxDepth &&
        this.children.length > this.maxChildren
      ) {
        this.subdivide();
      }
    } else {
      for (const index of this.findIndices(element.boundingBox)) {
        const node = this.nodes[index];
        // if (node.boundingBox.intersects(element.boundingBox)) {
        this.nodes[index].insert(element);
        // }
      }
    }
  }

  private subdivide(): void {
    const { depth, boundingBox, maxDepth, maxChildren } = this;
    const nextDepth = depth + 1;

    this.nodes[NODE_POSITION.TOP_LEFT] = new QuadNode(
      new Rectangle(
        boundingBox.width / 2,
        boundingBox.height / 2,
        boundingBox.x,
        boundingBox.y
      ),
      nextDepth,
      maxDepth,
      maxChildren
    );

    this.nodes[NODE_POSITION.TOP_RIGHT] = new QuadNode(
      new Rectangle(
        boundingBox.width / 2,
        boundingBox.height / 2,
        boundingBox.centerX,
        boundingBox.y
      ),
      nextDepth,
      maxDepth,
      maxChildren
    );

    this.nodes[NODE_POSITION.BOTTOM_LEFT] = new QuadNode(
      new Rectangle(
        boundingBox.width / 2,
        boundingBox.height / 2,
        boundingBox.x,
        boundingBox.centerY
      ),
      nextDepth,
      maxDepth,
      maxChildren
    );

    this.nodes[NODE_POSITION.BOTTOM_RIGHT] = new QuadNode(
      new Rectangle(
        boundingBox.width / 2,
        boundingBox.height / 2,
        boundingBox.centerX,
        boundingBox.centerY
      ),
      nextDepth,
      maxDepth,
      maxChildren
    );

    for (const child of this.children) {
      this.insert(child);
    }

    this.children = [];
  }

  private *retrieveInternal(rect: Rectangle): Generator<T> {
    if (this.boundingBox.intersects(rect)) {
      if (this.nodes.length === 0) {
        for (const child of this.children) {
          yield child;
        }
      }
      for (const node of this.nodes) {
        yield* node.retrieveInternal(rect);
      }
    }
  }

  public retrieve(rect: Rectangle): Set<T> {
    return new Set(this.retrieveInternal(rect));
  }
}

export class QuadTree<T extends Bounded> {
  private root: QuadNode<T>;

  constructor(bounds: Rectangle) {
    this.root = new QuadNode(bounds, 0, 4);
  }

  public render(ctx: GraphicsContext): void {
    ctx.pushOptions({
      lineWidth: 1,
      doFill: false,
    });
    this.root.render(ctx);
    ctx.popOptions();
  }

  public insert(element: T): void {
    this.root.insert(element);
  }

  public retrieve(rect: Rectangle): Set<T> {
    return this.root.retrieve(rect);
  }

  public clear(): void {
    this.root.clear();
  }
}

import Rectangle from "./rectangle";
import { GraphicsContext } from "../graphics/util";
import { WHITE } from "./color";

const NODE_POSITION = {
  TOP_LEFT: 0,
  TOP_RIGHT: 1,
  BOTTOM_LEFT: 2,
  BOTTOM_RIGHT: 3,
};

export interface Bounded {
  boundingBox: Rectangle;
}

class QuadNode<T extends Bounded> {
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

  private findIndex(rect: Rectangle): number {
    const isLeft = rect.x > this.boundingBox.centerX;
    const isBottom = rect.y > this.boundingBox.centerY;

    if (isLeft && isBottom) {
      return NODE_POSITION.BOTTOM_LEFT;
    } else if (isLeft) {
      return NODE_POSITION.TOP_LEFT;
    } else if (isBottom) {
      return NODE_POSITION.BOTTOM_RIGHT;
    } else {
      return NODE_POSITION.TOP_RIGHT;
    }
  }

  public insert(element: T) {
    if (this.nodes.length === 0) {
      this.children.push(element);

      if (this.depth < this.maxDepth && this.children.length > this.maxChildren) {
        this.subdivide();
      }
    } else {
      const index = this.findIndex(element.boundingBox);
      this.nodes[index].insert(element);
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

    // Insert children into each new child node
    for (const child of this.children) {
      this.insert(child);
    }

    this.children = [];
  }

  public *retrieve(rect: Rectangle): Generator<T> {
    if (this.nodes.length === 0) {
      for (const child of this.children) {
        yield child;
      }
    } else {
      const index = this.findIndex(rect);
      yield* this.nodes[index].retrieve(rect);
    }
  }
}

export class QuadTree<T extends Bounded> {
  private root: QuadNode<T>;

  constructor(bounds: Rectangle) {
    this.root = new QuadNode(bounds);
  }

  public render(ctx: GraphicsContext): void {
    this.root.render(ctx);
  }

  public insert(element: T): void {
    this.root.insert(element);
  }

  public *retrieve(rect: Rectangle): Generator<T> {
    yield* this.root.retrieve(rect);
  }

  public clear(): void {
    this.root.clear();
  }
}

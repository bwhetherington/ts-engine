import {Rectangle, Bounded, Partioner} from 'core/geometry';
import {GraphicsContext} from 'core/graphics';
import {BLACK} from 'core/graphics/color';
import {GraphicsPipeline} from 'core/graphics/pipe';

const NODE_POSITION = {
  TOP_LEFT: 0,
  TOP_RIGHT: 1,
  BOTTOM_LEFT: 2,
  BOTTOM_RIGHT: 3,
};

function calculateMaxDepth(size: number): number {
  return Math.floor(Math.log(size) / (2 * Math.log(2)));
}

class QuadNode<T extends Bounded> {
  public boundingBox: Rectangle;
  private children: T[] = [];
  private nodes: QuadNode<T>[] = [];
  private maxChildren: number;
  private maxDepth: number;
  private depth: number;

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
    const {x, y, width, height} = this.boundingBox;
    ctx.rect(x, y, width, height, BLACK);
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

  private *findIndices(rect: Rectangle): Iterable<number> {
    const {x, y, farX, farY} = rect;
    const {centerX, centerY} = this.boundingBox;

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
        node.insert(element);
      }
    }
  }

  private subdivide(): void {
    const {depth, boundingBox, maxDepth, maxChildren} = this;
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

  private *retrieveInternal(rect: Rectangle): Iterable<T> {
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

  public *retrievePointXY(x: number, y: number): Iterable<T> {
    if (this.boundingBox.containsPointXY(x, y)) {
      if (this.nodes.length === 0) {
        for (const child of this.children) {
          yield child;
        }
      }
      for (const node of this.nodes) {
        yield* node.retrievePointXY(x, y);
      }
    }
  }

  public retrieve(rect: Rectangle): Set<T> {
    return new Set(this.retrieveInternal(rect));
  }

  private *getAllInternal(): Iterable<T> {
    for (const child of this.children) {
      yield child;
    }
    for (const node of this.nodes) {
      yield* node.getAllInternal();
    }
  }

  public getAll(): Set<T> {
    return new Set(this.getAllInternal());
  }
}

export class QuadTree<T extends Bounded> extends Partioner<T> {
  private root: QuadNode<T>;
  private size: number = 0;

  constructor(bounds: Rectangle) {
    super(bounds);
    this.root = new QuadNode(bounds, 0, 4);
  }

  public resize(bounds: Rectangle): void {
    const elements = this.root.getAll();
    this.boundingBox = bounds;
    this.root = new QuadNode(this.boundingBox, 0, 4);
    for (const element of elements) {
      this.insert(element);
    }
  }

  public render(ctx: GraphicsContext): void {
    GraphicsPipeline.pipe()
      .options({lineWidth: 2, doFill: false, doStroke: true})
      .run(ctx, (ctx) => this.root.render(ctx));
  }

  public insert(element: T): void {
    this.root.insert(element);
    this.size += 1;
  }

  public query(rect: Rectangle): Set<T> {
    return this.root.retrieve(rect);
  }

  public queryPointXY(x: number, y: number): Set<T> {
    return new Set(this.root.retrievePointXY(x, y));
  }

  public clear(): void {
    this.root.clear();
    this.size = 0;
  }

  public getSize(): number {
    return this.size;
  }
}

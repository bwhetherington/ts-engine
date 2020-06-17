import Rectangle from "./rectangle";

enum NODE_POSITION {
  TOP_LEFT,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
}

interface Bounded {
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
}

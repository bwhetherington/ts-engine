import { WorldManager } from '.';
import { Rectangle } from 'core/geometry';
import { CollisionLayer } from './util';
import { GraphicsContext } from 'core/graphics';
import { WHITE, BLACK } from 'core/graphics/color';

export interface Node {
  x: number;
  y: number;
  isPathable: boolean;
  prev?: Node;
  neighborIndices: number[];
}

export class Graph {
  private nodes: Node[] = [];
  private width: number = 0;
  private height: number = 0;
  private spacing: number = 1;

  private constructor(nodes: Node[]) {
    this.nodes = nodes;
  }

  private getNode(x: number, y: number): Node | undefined {
    const flatIndex = x + y * this.height;
    return this.nodes[flatIndex];
  }

  public static sample(spacing: number): Graph {
    const { x, y, width, height, farX, farY } = WorldManager.boundingBox;
    const cols = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);

    const sampler = new Rectangle(5, 5);

    const nodes = [];

    // Populate graph from WorldManager
    for (let i = x; i < farX; i += spacing) {
      for (let j = y; j < farY; j += spacing) {
        // Check if this point is pathable
        sampler.centerX = i;
        sampler.centerY = j;

        const isPathable =
          WorldManager.boundingBox.contains(sampler) &&
          !WorldManager.query(sampler).any(
            (entity) =>
              entity.collisionLayer === CollisionLayer.Geometry &&
              entity.boundingBox.intersects(sampler)
          );

        const node = {
          x: i,
          y: j,
          isPathable,
          neighborIndices: [],
        };

        nodes.push(node);
      }
    }

    const graph = new Graph(nodes);
    graph.spacing = spacing;
    return graph;
  }

  public render(ctx: GraphicsContext): void {
    for (const node of this.nodes) {
      const { x, y } = node;
      const worldX = x;
      const worldY = y;
      ctx.ellipse(worldX, worldY, 5, 5, node.isPathable ? WHITE : BLACK);
    }
  }
}

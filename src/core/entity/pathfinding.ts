import {WorldManager, CollisionLayer} from 'core/entity';
import {Rectangle, Vector, VectorLike} from 'core/geometry';
import {GraphicsContext} from 'core/graphics';
import {WHITE, BLACK, rgb} from 'core/graphics/color';
import {Heap} from 'core/util';
import {Iterator} from 'core/iterator';
import {LogManager} from 'core/log';
import {Console} from 'console';
import {Entity} from './Entity';

const log = LogManager.forFile(__filename);

export interface Node {
  x: number;
  y: number;
  isPathable: boolean;
  prev?: Node;
  gScore: number;
  hScore: number;
  neighborIndices: [number, number][];
}

const NEIGHBOR_OFFSETS = [
  [-1, -1, Math.SQRT2],
  [0, -1, 1],
  [1, -1, Math.SQRT2],
  [-1, 0, 1],
  [1, 0, 1],
  [-1, 1, Math.SQRT2],
  [0, 1, 1],
  [1, 1, Math.SQRT2],
];

export interface CheckpointReachedEvent {
  point: Vector;
  entity: Entity;
}

export class Graph {
  private nodes: Node[] = [];
  private cols: number = 0;
  private rows: number = 0;
  private spacing: number = 1;

  private constructor(nodes: Node[]) {
    this.nodes = nodes;
  }

  private findPathInternal(from: Node, to: Node): Node[] | undefined {
    const openSet = new Heap((a: Node, b: Node) => b.gScore - a.gScore);
    const closedSet = new Set();
    const hasVisited = new Set();

    const visit = (node: Node) => {
      openSet.push(node);
      hasVisited.add(node);
    };

    from.gScore = 0;
    from.prev = undefined;

    visit(from);

    while (!openSet.isEmpty()) {
      const node = openSet.pop();

      if (node === to) {
        // We found the path
        const path = [];
        let node: Node | undefined = to;
        while (node) {
          path.push(node);
          node = node.prev;
        }
        return path.reverse();
      }

      if (!node) {
        break;
      }
      closedSet.add(node);
      for (const [index, dist] of node.neighborIndices) {
        const neighbor = this.getNodeFromIndex(index);
        if (!neighbor) {
          continue;
        }

        if (!hasVisited.has(neighbor)) {
          const dx = node.x - to.x;
          const dy = node.y - to.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          node.hScore = dist;
          neighbor.prev = undefined;
          neighbor.gScore = Infinity;
        }

        const fScore = neighbor.gScore + neighbor.hScore;
        const newFScore = node.gScore + dist + neighbor.hScore;

        if (
          !closedSet.has(neighbor) &&
          neighbor.isPathable &&
          !(fScore < newFScore)
        ) {
          neighbor.gScore = node.gScore + dist;
          neighbor.prev = node;
          visit(neighbor);
        }
      }
    }

    return undefined;
  }

  public findPath(from: VectorLike, to: VectorLike): Vector[] | undefined {
    const start = this.locateNodeXY(from.x, from.y);
    const end = this.locateNodeXY(to.x, to.y);

    if (!(start && end)) {
      // Invalid start or end node
      log.error('could not find start or end node');
      return undefined;
    }

    const path = this.findPathInternal(start, end);

    if (!path) {
      // No path found
      log.error('no path found');
      return undefined;
    }

    const mappedPath = Iterator.array(path).map(
      (node) => new Vector(node.x, node.y)
    );

    return [new Vector(from.x, from.y), ...mappedPath, new Vector(to.x, to.y)];
  }

  private locateNodeXY(worldX: number, worldY: number): Node | undefined {
    const x = worldX - WorldManager.boundingBox.x;
    const y = worldY - WorldManager.boundingBox.y;

    // Locate corners
    const rx0 = Math.floor(x / this.spacing);
    const ry0 = Math.floor(y / this.spacing);
    const rx1 = rx0 + 1;
    const ry1 = ry0 + 1;

    const pts = [
      [rx0, ry0],
      [rx1, ry0],
      [rx0, ry1],
      [rx1, ry1],
    ];

    let minDist2 = Infinity;
    let mx = -1;
    let my = -1;
    for (const [rx, ry] of pts) {
      const dx = rx * this.spacing - x;
      const dy = ry * this.spacing - y;
      const dist2 = dx * dx + dy * dy;
      const node = this.getNode(rx, ry);
      if (node?.isPathable && dist2 < minDist2) {
        minDist2 = dist2;
        mx = rx;
        my = ry;
      }
    }

    return this.getNode(my, mx);
  }

  private getNodeFromIndex(index: number): Node | undefined {
    return this.nodes[index];
  }

  private isInBounds(x: number, y: number): boolean {
    return 0 <= x && x < this.cols && 0 <= y && y < this.rows;
  }

  private getNode(x: number, y: number): Node | undefined {
    if (this.isInBounds(x, y)) {
      const flatIndex = x + y * this.rows;
      return this.nodes[flatIndex];
    } else {
      return undefined;
    }
  }

  public static sample(spacing: number): Graph {
    const {x, y, width, height, farX, farY} = WorldManager.boundingBox;
    const sampler = new Rectangle(5, 5);
    const cols = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);

    const nodes: Node[] = [];

    // Populate graph from WorldManager
    for (let i = x; i < farX; i += spacing) {
      for (let j = y; j < farY; j += spacing) {
        // Check if this point is pathable
        sampler.centerX = i;
        sampler.centerY = j;

        const isPathable =
          WorldManager.boundingBox.contains(sampler) &&
          !WorldManager.query(sampler).any(
            (entity) => entity.collisionLayer === CollisionLayer.Geometry
          );

        const node: Node = {
          x: i,
          y: j,
          isPathable,
          neighborIndices: [],
          gScore: Infinity,
          hScore: Infinity,
        };

        nodes.push(node);
      }
    }

    const graph = new Graph(nodes);
    graph.spacing = spacing;
    graph.cols = cols;
    graph.rows = rows;

    graph.populateNeighbors();

    return graph;
  }

  private populateNeighbors() {
    // Populate graph with neighbors
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const node = this.getNode(i, j);
        if (node?.isPathable) {
          for (const [dx, dy, dist] of NEIGHBOR_OFFSETS) {
            const x = i + dx;
            const y = j + dy;
            const neighbor = this.getNode(x, y);
            if (neighbor?.isPathable) {
              node.neighborIndices.push([x + y * this.cols, dist]);
            }
          }
        }
      }
    }
  }

  public render(ctx: GraphicsContext) {
    for (const node of this.nodes) {
      const {x, y, neighborIndices} = node;

      for (const [i] of neighborIndices) {
        const neighbor = this.getNodeFromIndex(i);
        if (neighbor) {
          const {x: nx, y: ny} = neighbor;
          ctx.line(x, y, nx, ny, rgb(0.5, 0.5, 0.5));
        }
      }

      const worldX = x;
      const worldY = y;

      const color = node.isPathable ? WHITE : BLACK;
      ctx.ellipse(worldX, worldY, 5, 5, color);
    }
  }
}

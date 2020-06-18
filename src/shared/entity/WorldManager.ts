import Rectangle from "../util/rectangle";
import { QuadTree, Bounded } from "../util/quadtree";
import { GraphicsContext } from "../graphics/util";
import Entity from "./Entity";
import { BLACK, WHITE } from "../util/color";
import LM from "../util/LogManager";

class WorldManager implements Bounded {
  private quadTree: QuadTree<Entity>;
  private entities: { [id: string]: Entity } = {};
  public boundingBox: Rectangle;

  constructor(boundingBox: Rectangle) {
    this.quadTree = new QuadTree(boundingBox);
    this.boundingBox = boundingBox;
  }

  public initialize(): void {
    LM.debug("WorldManager initialized");
  }

  public render(ctx: GraphicsContext): void {
    ctx.clear();
    ctx.begin();
    ctx.resetTransform();
    ctx.translate(-this.boundingBox.x, -this.boundingBox.y);

    // ctx.rect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height, WHITE);
    this.quadTree.render(ctx);

    for (const entity of this.getEntities()) {
      entity.render(ctx);
    }
  }

  public addEntity(entity: Entity): void {
    this.entities[entity.id] = entity;
  }

  public *getEntities(): Generator<Entity> {
    for (const id in this.entities) {
      yield this.entities[id];
    }
  }

  public step(dt: number): void {
    // Step each entity
    for (const entity of this.getEntities()) {
      entity.step(dt);
    }

    // Reinsert each entity into the quad tree
    this.quadTree.clear();
    for (const entity of this.getEntities()) {
      this.quadTree.insert(entity);
    }

    // Check for collisions
    for (const entity of this.getEntities()) {
      // Query for entities that may collide with this entity
      let collided = false;
      for (const candidate of this.quadTree.retrieve(entity.boundingBox)) {
        if (entity.boundingBox.intersects(candidate.boundingBox)) {
          // Collision
          collided = true;
          break;
        }
      }
      entity.color = collided ? BLACK : WHITE;

      // Collide with walls
      if (entity.boundingBox.x < this.boundingBox.x || entity.boundingBox.farX > this.boundingBox.farX) {
        entity.velocity.x *= -1;
        // LM.info("horizontal collision");
      }
      if (entity.boundingBox.y < this.boundingBox.y || entity.boundingBox.farY > this.boundingBox.farY) {
        entity.velocity.y *= -1;
        // LM.info("vertical collision");
      }
    }
  }
}

const WM = new WorldManager(new Rectangle(500, 500, -250, -250));
export default WM;
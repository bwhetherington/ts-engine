import { Rectangle, QuadTree, Bounded } from 'core/util';
import { GraphicsContext } from 'core/graphics';
import { Entity, CollisionEvent, CollisionLayer } from 'core/entity';
import { LM } from 'core/log';
import { EM, GameEvent } from 'core/event';

const LAYER_INDICES: { [layer in CollisionLayer]: number } = {
  geometry: 0,
  unit: 1,
};

export class WorldManager implements Bounded {
  public quadTree: QuadTree<Entity>;
  private entities: { [id: string]: Entity } = {};
  public boundingBox: Rectangle;
  private collisionLayers: Entity[][] = [[], []];

  constructor(boundingBox: Rectangle) {
    this.quadTree = new QuadTree(boundingBox);
    this.boundingBox = boundingBox;
  }

  public initialize(): void {
    LM.debug('WorldManager initialized');
  }

  public render(ctx: GraphicsContext): void {
    ctx.clear();
    ctx.begin();
    ctx.resetTransform();
    ctx.translate(-this.boundingBox.x, -this.boundingBox.y);

    // ctx.rect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height, WHITE);
    this.quadTree.render(ctx);

    for (const entity of this.getEntitiesLayerOrdered()) {
      entity.render(ctx);
    }
  }

  public *getEntitiesLayerOrdered(): Generator<Entity> {
    for (const layer of this.collisionLayers) {
      for (const entity of layer) {
        yield entity;
      }
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

      // Check for collision with bounds
      let dx = 0;
      let dy = 0;

      if (entity.boundingBox.x < this.boundingBox.x) {
        dx += this.boundingBox.x - entity.boundingBox.x;
      }
      if (entity.boundingBox.farX > this.boundingBox.farX) {
        dx += this.boundingBox.farX - entity.boundingBox.farX;
      }
      if (entity.boundingBox.y < this.boundingBox.y) {
        dy += this.boundingBox.y - entity.boundingBox.y;
      }
      if (entity.boundingBox.farY > this.boundingBox.farY) {
        dy += this.boundingBox.farY - entity.boundingBox.farY;
      }

      if (dx !== 0) {
        entity.velocity.x *= -1;
      }
      if (dy !== 0) {
        entity.velocity.y *= -1;
      }

      entity.addPositionXY(dx, dy);
    }

    // Reinsert each entity into the quad tree
    this.quadTree.clear();
    this.collisionLayers = [[], []];
    for (const entity of this.getEntities()) {
      this.quadTree.insert(entity);
      const layerIndex = LAYER_INDICES[entity.collisionLayer];
      this.collisionLayers[layerIndex]?.push(entity);
    }

    // Check for collisions
    for (const entity of this.getEntities()) {
      // Query for entities that may collide with this entity
      let collided = false;
      // for (const candidate of this.getEntities()) {
      for (const candidate of this.quadTree.retrieve(entity.boundingBox)) {
        if (
          entity.id !== candidate.id &&
          (entity.boundingBox.intersects(candidate.boundingBox) ||
            candidate.boundingBox.intersects(entity.boundingBox))
        ) {
          // Collision
          collided = true;
          const data: CollisionEvent = {
            collider: entity,
            collided: candidate,
          };
          const event: GameEvent = {
            type: 'CollisionEvent',
            data,
          };
          EM.emit(event);
        }
      }
    }
  }
}

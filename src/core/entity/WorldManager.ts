import { Rectangle, QuadTree, Bounded } from 'core/geometry';
import { GraphicsContext, CM } from 'core/graphics';
import {
  CollisionEvent,
  CollisionLayer,
  Entity,
  Unit,
  Hero,
  Geometry,
  shuntOutOf,
} from 'core/entity';
import { LM as InternalLogger } from 'core/log';
import { EM, GameEvent, StepEvent } from 'core/event';
import { Serializable, Data } from 'core/serialize';
import { Iterator, iterateObject, iterator } from 'core/iterator';
import { diff } from 'core/util';
import { SyncEvent } from 'core/net';

const LM = InternalLogger.forFile(__filename);

const LAYER_INDICES: { [layer in CollisionLayer]: number } = {
  geometry: 0,
  unit: 1,
};

export class WorldManager implements Bounded, Serializable {
  public quadTree: QuadTree<Entity>;
  private entities: { [id: string]: Entity } = {};
  public boundingBox: Rectangle;
  private collisionLayers: Entity[][] = [[], []];
  private entityConstructors: { [type: string]: new () => Entity } = {};
  public previousState: Record<string, Data> = {};
  private toDelete: string[] = [];

  constructor(boundingBox: Rectangle) {
    this.quadTree = new QuadTree(boundingBox);
    this.boundingBox = boundingBox;
  }

  private registerEntities(): void {
    this.registerEntity(Entity);
    this.registerEntity(Unit);
    this.registerEntity(Hero);
    this.registerEntity(Geometry);
  }

  public initialize(): void {
    LM.debug('WorldManager initialized');

    this.registerEntities();

    EM.addListener<SyncEvent>('SyncEvent', (event) => {
      this.deserialize(event.data.worldData);
    });

    EM.addListener<StepEvent>('StepEvent', (event) => {
      this.step(event.data.dt);
    });
  }

  public render(ctx: GraphicsContext): void {
    ctx.clear();
    ctx.begin();
    ctx.resetTransform();

    const camBounds = CM.boundingBox;
    ctx.translate(-camBounds.x, -camBounds.y);

    // ctx.rect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height, WHITE);
    this.quadTree.render(ctx);

    this.getEntitiesLayerOrdered()
      .filter((entity) => entity.boundingBox.intersects(camBounds))
      .forEach((entity) => entity.render(ctx));
  }

  private *getEntitiesLayerOrderedInternal(): Generator<Entity> {
    for (const layer of this.collisionLayers) {
      for (const entity of layer) {
        yield entity;
      }
    }
  }

  public getEntitiesLayerOrdered(): Iterator<Entity> {
    return iterator(this.getEntitiesLayerOrderedInternal());
  }

  public add(entity: Entity): void {
    this.entities[entity.id] = entity;
  }

  public remove(entity: Entity | string): void {
    let actual: Entity | undefined = undefined;
    if (typeof entity === 'string') {
      actual = this.getEntity(entity);
    } else {
      actual = entity;
    }
    actual?.cleanup();
    if (actual) {
      delete this.entities[actual.id];
    }
  }

  public getEntities(): Iterator<Entity> {
    return iterateObject(this.entities);
  }

  private *queryInternal(box: Rectangle): Generator<Entity> {
    for (const entity of this.quadTree.retrieve(box)) {
      yield entity;
    }
  }

  public query(box: Rectangle): Iterator<Entity> {
    return iterator(this.queryInternal(box));
  }

  public step(dt: number): void {
    // Clear deleted entities
    this.toDelete = [];

    // Step each entity
    for (const entity of this.getEntities()) {
      if (entity.markedForDelete) {
        this.toDelete.push(entity.id);
      }
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

    // Delete marked entities
    for (const entity of this.toDelete) {
      LM.info('delete ' + entity);
      const entityObj = this.getEntity(entity);
      entityObj?.cleanup();
      this.remove(entity);
    }
  }

  public registerEntity(Type: (new () => Entity) & typeof Entity) {
    const name = Type.typeName;
    this.entityConstructors[name] = Type;
    LM.debug(`entity ${name} registered`);
  }

  private createEntity(type: string): Entity | undefined {
    const Type = this.entityConstructors[type];
    if (Type) {
      return new Type();
    } else {
      return undefined;
    }
  }

  public serialize(): Data {
    const out = <Data>{
      entities: {},
      deleted: this.toDelete,
    };
    for (const key in this.entities) {
      out.entities[key] = this.entities[key].serialize();
    }
    return out;
  }

  public deserialize(data: Data): void {
    const { entities, deleted } = data;
    for (const id in entities) {
      const entry = entities[id];
      if (Object.keys(entry).length === 0) {
        continue;
      }
      const { type } = entry;
      let entity = this.getEntity(id);
      if (!entity && typeof type === 'string') {
        entity = this.createEntity(type);
        if (entity) {
          entity.id = id;
          this.add(entity);
        }
      }
      if (entity) {
        entity.deserialize(entry);
      } else {
        LM.error(`failed to create entity from data: ${JSON.stringify(entry)}`);
      }
    }

    if (deleted instanceof Array) {
      console.log(deleted);
      iterator(deleted)
        .map((id) => this.getEntity(id))
        .forEach((entity) => entity?.markForDelete());
    }
  }

  public diffState(): Data {
    const diffObj = {};
    const newState = this.serialize();
    diff(this.previousState, newState, diffObj);
    this.previousState = newState;
    return diffObj;
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities[id];
  }
}

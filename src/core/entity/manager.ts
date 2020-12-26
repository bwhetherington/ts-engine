import {Rectangle, QuadTree, Bounded, Vector, Partioner} from 'core/geometry';
import {GraphicsContext, CameraManager, Renderable} from 'core/graphics';
import {
  Entity,
  Unit,
  Hero,
  Geometry,
  Text,
  TimedText,
  Projectile,
  Explosion,
  CollisionEvent,
  Tank,
  Enemy,
  CollisionLayer,
  Bar,
  Echo,
  Ray,
  RayCastResult,
  DisplayRayEvent,
  HomingProjectile,
  Feed,
} from 'core/entity';
import {
  BigProjectile,
  HeavyEnemy,
  Template,
  SniperHero,
  MachineGunHero,
  HomingEnemy,
} from 'core/entity/template';
import {LogManager} from 'core/log';
import {EventManager, StepEvent} from 'core/event';
import {Serializable, Data} from 'core/serialize';
import {Iterator, iterator} from 'core/iterator';
import {diff} from 'core/util';
import {SyncEvent} from 'core/net';
import {WALL_COLOR} from 'core/entity/Geometry';
import {WHITE, reshade} from 'core/graphics/color';
import {Graph} from 'core/entity/pathfinding';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {RNGManager} from 'core/random';

const log = LogManager.forFile(__filename);

export class WorldManager implements Bounded, Serializable, Renderable {
  public space: Partioner<Entity>;
  private entities: Record<string, Entity> = {};
  public boundingBox: Rectangle;
  private collisionLayers: Entity[][] = [[], []];
  private entityConstructors: Record<string, () => Entity> = {};
  public previousState: Record<string, Data> = {};
  private toDelete: string[] = [];
  private entityCount: number = 0;
  private unitCount: number = 0;
  private entityCounts: Record<string, number> = {};

  private graph?: Graph;
  private shouldPopulateGraph: boolean = false;

  constructor(boundingBox: Rectangle) {
    // this.space = new Cell(boundingBox, 150, 150);
    this.space = new QuadTree(boundingBox);
    this.boundingBox = boundingBox;
  }

  public resize(bounds: Rectangle): void {
    this.boundingBox.deserialize(bounds);
    this.space.resize(bounds);
  }

  public registerTemplateEntity(template: Template): void {
    const {type, extends: base} = template;
    const baseConstructor = this.entityConstructors[base];
    const gen = () => {
      const entity = baseConstructor();
      entity.deserialize(template, false);
      return entity;
    };
    this.entityConstructors[type] = gen;
  }

  private registerAllEntities(): void {
    // Class entities
    this.registerEntity(Entity);
    this.registerEntity(Unit);
    this.registerEntity(Hero);
    this.registerEntity(Geometry);
    this.registerEntity(Explosion);
    this.registerEntity(Ray);
    this.registerEntity(Projectile);
    this.registerEntity(Text);
    this.registerEntity(Tank);
    this.registerEntity(TimedText);
    this.registerEntity(Enemy);
    this.registerEntity(Bar);
    this.registerEntity(Echo);
    this.registerEntity(HomingProjectile);
    this.registerEntity(Feed);

    // Template entities
    this.registerTemplateEntity(BigProjectile);
    this.registerTemplateEntity(HeavyEnemy);
    this.registerTemplateEntity(HomingEnemy);
    this.registerTemplateEntity(SniperHero);
    this.registerTemplateEntity(MachineGunHero);
  }

  public initialize(): void {
    log.debug('WorldManager initialized');

    this.registerAllEntities();

    EventManager.addListener<SyncEvent>('SyncEvent', (event) => {
      this.deserialize(event.data.worldData);
    });

    EventManager.addListener<StepEvent>('StepEvent', (event) => {
      this.step(event.data.dt);
    });

    EventManager.addListener<DisplayRayEvent>('DisplayRayEvent', (event) => {
      const {start, stop, sourceID} = event.data;

      let color;
      const source = this.getEntity(sourceID);
      if (source instanceof Unit) {
        color = reshade(source.getBaseColor());
      } else {
        color = WHITE;
      }
      color.alpha = (color.alpha ?? 1) * (2/3);

      const ray = new Ray();
      ray.initialize(start, stop);
      ray.setColor(color);
      this.add(ray);
    });
  }

  public render(ctx: GraphicsContext): void {
    ctx.clear(WALL_COLOR);
    const GRID_COLOR = reshade(WALL_COLOR, -0.05);
    ctx.begin();
    ctx.resetTransform();

    const camBounds = CameraManager.boundingBox;
    ctx.scale(CameraManager.scale);
    ctx.translate(-camBounds.x, -camBounds.y);

    ctx.pushOptions({
      lineWidth: 4,
      doFill: true,
      doStroke: false,
    });
    ctx.rect(
      this.boundingBox.x,
      this.boundingBox.y,
      this.boundingBox.width,
      this.boundingBox.height,
      WHITE
    );
    ctx.popOptions();

    ctx.withOptions(
      {
        lineWidth: 2,
        doFill: false,
        doStroke: true,
      },
      (ctx) => {
        const stepSize = 20;
        for (
          let x = this.boundingBox.x + stepSize;
          x < this.boundingBox.farX;
          x += stepSize
        ) {
          ctx.line(x, this.boundingBox.y, x, this.boundingBox.farY, GRID_COLOR);
        }
        for (
          let y = this.boundingBox.y + stepSize;
          y < this.boundingBox.farY;
          y += stepSize
        ) {
          ctx.line(this.boundingBox.x, y, this.boundingBox.farX, y, GRID_COLOR);
        }
      }
    );

    // this.space.render(ctx);

    GraphicsPipeline.pipe()
      .options({
        lineWidth: 4,
        doFill: false,
        doStroke: true,
      })
      .run(ctx, (ctx) => {
        ctx.rect(
          this.boundingBox.x,
          this.boundingBox.y,
          this.boundingBox.width,
          this.boundingBox.height,
          WALL_COLOR
        );
      });

    this.getEntitiesLayerOrdered()
      .filter((entity) => entity.boundingBox.intersects(camBounds))
      .forEach((entity) => {
        GraphicsPipeline.pipe()
          .translate(entity.position.x, entity.position.y)
          .rotate(entity.angle)
          .run(ctx, entity.renderInternal.bind(entity));
      });

    // this.graph?.render(ctx);
  }

  private *getEntitiesLayerOrderedInternal(): Iterable<Entity> {
    for (const layer of this.collisionLayers) {
      for (const entity of layer) {
        yield entity;
      }
    }
  }

  public getEntitiesLayerOrdered(): Iterator<Entity> {
    return iterator(this.getEntitiesLayerOrderedInternal());
  }

  public getRandomPosition(): Vector {
    return RNGManager.nextVector(this.boundingBox);
  }

  private populateGraph(): void {
    if (this.shouldPopulateGraph) {
      this.graph = Graph.sample(25);
      this.shouldPopulateGraph = false;
    }
  }

  private addEntityCount(entity: Entity): void {
    if (this.entityCounts.hasOwnProperty(entity.type)) {
      this.entityCounts[entity.type] += 1;
    }
  }

  private removeEntityCount(entity: Entity): void {
    if (this.entityCounts.hasOwnProperty(entity.type)) {
      this.entityCounts[entity.type] -= 1;
    }
  }

  public add(entity: Entity): void {
    this.entities[entity.id] = entity;
    entity.load();
    log.trace('add ' + entity.toString());
    this.entityCount += 1;
    if (entity instanceof Unit) {
      this.unitCount += 1;
    }
    this.addEntityCount(entity);

    if (entity.collisionLayer === CollisionLayer.Geometry) {
      this.shouldPopulateGraph = true;
    }
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
      log.trace('remove ' + actual.toString());
      delete this.entities[actual.id];
      this.entityCount -= 1;
      if (actual instanceof Unit) {
        this.unitCount -= 1;
      }
      this.removeEntityCount(actual);
    }
  }

  public getEntities(): Iterator<Entity> {
    return Iterator.values(this.entities);
  }

  private *queryInternal(box: Rectangle): Iterable<Entity> {
    for (const entity of this.space.query(box)) {
      yield entity;
    }
  }

  public query(box: Rectangle): Iterator<Entity> {
    return iterator(this.queryInternal(box));
  }

  public querySet(box: Rectangle): Set<Entity> {
    return this.space.query(box);
  }

  public step(dt: number): void {
    // Clear deleted entities
    this.toDelete = [];

    // Step each entity
    this.getEntities().forEach((entity) => {
      if (entity.markedForDelete) {
        this.toDelete.push(entity.id);
      }
      entity.step(dt);

      // Check for collision with bounds
      if (entity.isCollidable) {
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

        let didCollide = false;
        if (dx !== 0) {
          entity.velocity.x *= -entity.bounce;
          didCollide = true;
        }
        if (dy !== 0) {
          entity.velocity.y *= -entity.bounce;
          didCollide = true;
        }

        if (didCollide) {
          entity.collide();
          EventManager.emit<CollisionEvent>({
            type: 'CollisionEvent',
            data: {collider: entity},
          });
        }

        entity.addPositionXY(dx, dy);
      }
    });

    // Reinsert each entity into the quad tree
    this.space.clear();
    this.collisionLayers = [[], [], [], [], []];

    this.getEntities().forEach((entity) => {
      if (entity.isCollidable) {
        this.space.insert(entity);
      }
      const layerIndex = entity.collisionLayer;
      this.collisionLayers[layerIndex]?.push(entity);
    });

    this.populateGraph();

    // Delete marked entities
    for (const entity of this.toDelete) {
      this.remove(entity);
    }
  }

  public registerEntity(Type: (new () => Entity) & typeof Entity) {
    const name = Type.typeName;
    if (name in this.entityConstructors) {
      log.error(`type ${name} is already registered`);
    } else {
      this.entityConstructors[name] = () => new Type();
      log.trace(`entity ${name} registered`);
    }
  }

  public spawn<T extends Entity>(
    Type: (new () => T) & typeof Entity,
    position?: Vector
  ): T {
    const entity = new Type();
    if (position) {
      entity.position.set(position);
    }
    this.add(entity);
    return entity;
  }

  public spawnEntity(type: string, position?: Vector): Entity {
    const gen = this.entityConstructors[type];
    const entity = gen();
    if (position) {
      entity.position.set(position);
    }
    this.add(entity);
    return entity;
  }

  public createEntity(type: string): Entity | undefined {
    const Type = this.entityConstructors[type];
    if (Type) {
      return Type();
    } else {
      return undefined;
    }
  }

  public serialize(): Data {
    const out = <Data>{
      entities: {},
      deleted: this.toDelete,
      boundingBox: this.boundingBox.serialize(),
    };
    for (const key in this.entities) {
      const entity = this.entities[key];
      if (entity.markedForDelete) {
        out.deleted.push(entity.id);
      } else {
        out.entities[key] = this.entities[key].serialize();
      }
    }
    return out;
  }

  public deserialize(data: Data): void {
    const {entities, deleted, boundingBox} = data;
    for (const id in entities) {
      const entry = entities[id];
      if (Object.keys(entry).length === 0) {
        continue;
      }
      const {type} = entry;
      let entity = this.getEntity(id);
      let createdEntity = false;
      if (!entity && typeof type === 'string') {
        entity = this.createEntity(type);
        if (entity) {
          entity.id = id;
          createdEntity = true;
          this.add(entity);
        }
      }
      if (entity && (createdEntity || entity.doSync)) {
        entity.deserialize(entry);
      } else {
        log.warn(`failed to create entity from data: ${JSON.stringify(entry)}`);
      }
    }

    if (deleted instanceof Array) {
      iterator(deleted)
        .map((id) => this.getEntity(id))
        .filterType((entity): entity is Entity => !!entity)
        .forEach((entity) => entity.markForDelete());
    }

    if (boundingBox) {
      this.boundingBox.deserialize(boundingBox);
    }
  }

  public diffState(): Data {
    const diffObj = {};
    const newState = this.serialize();
    diff(this.previousState, newState, diffObj);
    this.previousState = newState;
    return diffObj;
  }

  public getEntity(id?: string): Entity | undefined {
    return id ? this.entities[id] : undefined;
  }

  public getEntityCount(): number {
    return this.entityCount;
  }

  public getUnitCount(): number {
    return this.unitCount;
  }

  public isInBounds(rect: Rectangle): boolean {
    return this.boundingBox.contains(rect);
  }

  public castRay(
    from: Vector,
    angle: number,
    maxDist: number,
    maxTargets: number,
    validate: (x: Entity) => boolean
  ): RayCastResult {
    const stepSize = 5;
    let traveled = 0;

    const hit: Set<Entity> = new Set();
    const vecBuffer = new Vector(1, 0);

    vecBuffer.angle = angle;
    vecBuffer.magnitude = stepSize;

    const cursor = new Rectangle(stepSize * 2, stepSize * 2);
    cursor.setCenter(from);

    while (
      traveled < maxDist &&
      hit.size < maxTargets &&
      this.isInBounds(cursor)
    ) {
      // Check if we collide with any entities
      const query = this.querySet(cursor);

      const candidates = Iterator.from(query)
        .filter((candidate) => candidate.boundingBox.intersects(cursor))
        .filter(validate);
      for (const candidate of candidates) {
        hit.add(candidate);
        if (hit.size >= maxTargets) {
          break;
        }
      }

      const hitWall = iterator(query)
        .filter((candidate) => candidate.boundingBox.intersects(cursor))
        .any(
          (candidate) => candidate.collisionLayer === CollisionLayer.Geometry
        );
      if (hitWall) {
        break;
      }

      // Move cursor forwards
      cursor.centerX += vecBuffer.x;
      cursor.centerY += vecBuffer.y;
      traveled += stepSize;
    }

    vecBuffer.setXY(cursor.centerX, cursor.centerY);

    return {
      hit,
      end: vecBuffer,
    };
  }

  public loadLevel(level: Data): void {
    const {boundingBox, geometry} = level;
    if (boundingBox && geometry) {
      // Erase previous geometry
      this.getEntities()
        .filter((entity) => entity.collisionLayer === CollisionLayer.Geometry)
        .forEach((entity) => entity.markForDelete());

      this.boundingBox.deserialize(boundingBox);
      this.boundingBox.centerX = 0;
      this.boundingBox.centerY = 0;

      this.resize(this.boundingBox);

      for (const element of geometry) {
        const rect = new Rectangle();
        const {x, y, width, height} = element;
        rect.width = width;
        rect.height = height;
        rect.centerX = x;
        rect.centerY = y;

        const entity = Geometry.fromRectangle(rect);
        this.add(entity);
      }
    }
  }
}

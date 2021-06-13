import {
  Rectangle,
  QuadTree,
  Bounded,
  Vector,
  Partioner,
  VectorLike,
} from 'core/geometry';
import {GraphicsContext, CameraManager, Renderable} from 'core/graphics';
import {
  Entity,
  Unit,
  BaseHero,
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
  HomingProjectile,
  Feed,
  SyncHeroEvent,
  Follow,
} from 'core/entity';
import {LogManager} from 'core/log';
import {EventManager, Priority, StepEvent} from 'core/event';
import {Serializable, Data} from 'core/serialize';
import {Iterator, iterator} from 'core/iterator';
import {diff} from 'core/util';
import {NetworkManager, SyncEvent} from 'core/net';
import {WALL_COLOR} from 'core/entity/Geometry';
import {WHITE, reshade, BLACK} from 'core/graphics/color';
import {Graph} from 'core/entity/pathfinding';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {RNGManager} from 'core/random';
import {
  AssetManager,
  AssetTemplate,
  AssetType,
  LoadingManager,
} from 'core/assets';
import {UUID, UUIDManager} from 'core/uuid';
import {DataBuffer} from 'core/buf';
import {Trail} from './Trail';
import {ShatterProjectile} from './ShatterProjectile';

const log = LogManager.forFile(__filename);

export class WorldManager extends LoadingManager<Entity>
  implements Bounded, Serializable, Renderable {
  public space: Partioner<Entity>;
  private entities: Record<UUID, Entity> = {};
  public boundingBox: Rectangle;
  private collisionLayers: Entity[][] = [[], []];
  public previousState: Record<UUID, Data> = {};
  private toDelete: UUID[] = [];
  private entityCount: number = 0;
  private unitCount: number = 0;
  private entityCounts: Record<string, number> = {};
  public friction: number = 1;

  private graph?: Graph;
  private shouldPopulateGraph: boolean = false;

  constructor(boundingBox: Rectangle) {
    super('WorldManager');
    // this.space = new Cell(boundingBox, 150, 150);
    this.space = new QuadTree(boundingBox);
    this.boundingBox = boundingBox;
  }

  public resize(bounds: Rectangle): void {
    this.boundingBox.deserialize(bounds);
    this.space.resize(bounds);
  }

  private async registerAllEntities(): Promise<void> {
    // Class entities
    this.registerAssetType(Entity);
    this.registerAssetType(Unit);
    this.registerAssetType(BaseHero);
    this.registerAssetType(Geometry);
    this.registerAssetType(Explosion);
    this.registerAssetType(Ray);
    this.registerAssetType(Projectile);
    this.registerAssetType(Tank);
    this.registerAssetType(Enemy);
    this.registerAssetType(HomingProjectile);
    this.registerAssetType(ShatterProjectile);
    this.registerAssetType(Feed);

    // Effect entities
    this.registerAssetType(Text);
    this.registerAssetType(TimedText);
    this.registerAssetType(Bar);
    this.registerAssetType(Echo);
    this.registerAssetType(Trail);
    this.registerAssetType(Follow);

    await this.loadAssetTemplates('templates/entities');
  }

  public async initialize(): Promise<void> {
    log.debug('WorldManager initialized');

    await this.registerAllEntities();

    if (NetworkManager.isClient()) {
      EventManager.streamEvents<SyncEvent>('SyncEvent').forEach(
        ({data: {worldData}}) => {
          this.deserialize(worldData);
        }
      );
    }

    if (NetworkManager.isServer()) {
      EventManager.streamEventsForPlayer<SyncHeroEvent>('SyncHeroEvent')
        .filterMap(({player, data: {hero}}) => {
          const playerHero = player.hero;
          if (playerHero) {
            return {hero: playerHero, heroData: hero};
          }
        })
        .filter(({hero, heroData}) => hero.id === heroData.id)
        .forEach(({hero, heroData}) => {
          const {weaponAngle, position} = heroData;
          if (typeof weaponAngle === 'number') {
            hero.weaponAngle = weaponAngle;
          }
          if (position) {
            hero.position.deserialize(position);
          }
        });
    }

    EventManager.streamEvents<StepEvent>(
      'StepEvent',
      Priority.High
    ).forEach(({data: {dt}}) => this.step(dt));
  }

  public render(ctx: GraphicsContext): void {
    ctx.clear(WALL_COLOR);
    const GRID_COLOR = {red: 0.05, green: 0.05, blue: 0.05};
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
      BLACK
    );
    ctx.popOptions();

    GraphicsPipeline.pipe()
      .options({
        lineWidth: 2,
        doFill: false,
        doStroke: true,
      })
      .run(ctx, (ctx) => {
        const stepSize = 20;
        const bounds = CameraManager.boundingBox;

        // Compute
        const xOffset = (this.boundingBox.x - bounds.x) % stepSize;
        const yOffset = (this.boundingBox.y - bounds.y) % stepSize;

        const minX = Math.max(this.boundingBox.x, bounds.x);
        const maxX = Math.min(this.boundingBox.farX, bounds.farX);
        const minY = Math.max(this.boundingBox.y, bounds.y);
        const maxY = Math.min(this.boundingBox.farY, bounds.farY);

        const xStart = Math.max(this.boundingBox.x, bounds.x + xOffset);
        const yStart = Math.max(this.boundingBox.y, bounds.y + yOffset);

        for (let x = xStart; x < maxX; x += stepSize) {
          ctx.line(x, minY, x, maxY, GRID_COLOR);
        }
        for (let y = yStart; y < maxY; y += stepSize) {
          ctx.line(minX, y, maxX, y, GRID_COLOR);
        }
      });

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

    // this.graph?.render(ctx);

    this.getEntitiesLayerOrdered()
      .filter((entity) => entity.boundingBox.intersects(camBounds))
      .forEach((entity) => {
        GraphicsPipeline.pipe()
          .translate(entity.position.x, entity.position.y)
          .rotate(entity.angle)
          .run(ctx, entity.renderInternal.bind(entity));
      });
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
    const cursor = new Rectangle(5, 5, 0, 0);
    let position = RNGManager.nextVector(this.boundingBox);
    cursor.setCenter(position);
    let attempts = 0;
    while (
      attempts < 10 &&
      this.query(cursor)
        .filter((entity) => entity.collisionLayer === CollisionLayer.Geometry)
        .any((entity) => !!entity)
    ) {
      attempts += 1;
      position = RNGManager.nextVector(this.boundingBox);
    }
    return position;
  }

  private populateGraph(): void {
    if (this.shouldPopulateGraph) {
      this.graph = Graph.sample(50);
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

  public remove(entity: Entity | UUID): void {
    let actual: Entity | undefined = undefined;
    if (typeof entity === 'number') {
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
    yield* this.space.query(box);
  }

  public query(box: Rectangle): Iterator<Entity> {
    return Iterator.from(this.queryInternal(box)).filter((entity) =>
      entity.boundingBox.intersects(box)
    );
  }

  private *queryPointXYInternal(x: number, y: number): Iterable<Entity> {
    yield* this.space.queryPointXY(x, y);
  }

  public queryPointXY(x: number, y: number): Iterator<Entity> {
    return Iterator.from(this.queryPointXYInternal(x, y)).filter((entity) =>
      entity.boundingBox.containsPointXY(x, y)
    );
  }

  public queryPoint(pt: VectorLike): Iterator<Entity> {
    return this.queryPointXY(pt.x, pt.y);
  }

  public findPath(from: Vector, to: Vector): Vector[] | undefined {
    return this.graph?.findPath(from, to);
  }

  public deleteEntities(): void {
    // Delete marked entities
    for (const entity of this.toDelete) {
      this.remove(entity);
    }

    // Clear deleted entities
    this.toDelete = [];
  }

  public step(dt: number): void {
    this.deleteEntities();
    // Step each entity
    const isClient = NetworkManager.isClient();
    const shouldProcessLocalEntity = (entity: Entity) =>
      isClient ? CameraManager.isInFrame(entity) : true;
    this.getEntities().forEach((entity) => {
      if (entity.markedForDelete) {
        this.toDelete.push(entity.id);
      }
      entity.step(dt);

      // Check for collision with bounds
      if (entity.isCollidable && shouldProcessLocalEntity(entity)) {
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
    this.collisionLayers = [[], [], [], [], [], []];

    this.getEntities().forEach((entity) => {
      entity.afterStep();
      if (
        entity.isCollidable &&
        entity.isSpatial &&
        shouldProcessLocalEntity(entity)
      ) {
        this.space.insert(entity);
      }
      const layerIndex = entity.collisionLayer;
      this.collisionLayers[layerIndex]?.push(entity);
    });

    this.populateGraph();
  }

  public spawn<T extends Entity>(
    Type: AssetType<T>,
    position?: Vector
  ): T | undefined {
    const entity = this.instantiateType(Type);
    if (!entity) {
      return undefined;
    }
    if (position) {
      entity.setPosition(position);
    }
    this.add(entity);
    return entity;
  }

  public spawnEntity(type: string, position?: Vector): Entity | undefined {
    const entity = this.instantiate(type);
    if (!entity) {
      return;
    }
    if (position) {
      entity.setPosition(position);
    }
    this.add(entity);
    return entity;
  }

  public async setLevel(name: string): Promise<void> {
    const path = `worlds/${name}.json`;
    const data = await AssetManager.loadJSON(path);
    this.loadLevel(data);
  }

  public serialize(): Data {
    const out = <Data>{
      entities: {},
      deleted: this.toDelete,
      boundingBox: this.boundingBox.serialize(),
      friction: this.friction,
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
    const {entities, deleted, boundingBox, friction} = data;
    for (const id in entities) {
      const entry = entities[id];
      if (Object.keys(entry).length === 0) {
        continue;
      }
      const {type} = entry;
      const idNum = UUIDManager.from(id);
      let entity = this.getEntity(idNum);
      let createdEntity = false;
      if (!entity && typeof type === 'string') {
        entity = this.instantiate(type);
        if (entity) {
          if (entity.id !== idNum) {
            UUIDManager.free(entity.id);
            entity.id = idNum;
          }
          createdEntity = true;
          this.add(entity);
        }
      }
      if (entity && (createdEntity || entity.doSync)) {
        entity.deserialize(entry, true);
      } else {
        log.warn(`failed to create entity from data: ${JSON.stringify(entry)}`);
      }
    }

    if (deleted instanceof Array) {
      iterator(deleted)
        .map((id) => this.getEntity(id))
        .filterType((entity): entity is Entity => !!entity)
        .forEach((entity) => {
          entity.markForDelete();
        });
    }

    if (boundingBox) {
      this.boundingBox.deserialize(boundingBox);
    }

    if (typeof friction === 'number') {
      this.friction = friction;
    }
  }

  public diffState(): Data {
    const diffObj = {};
    const newState = this.serialize();
    diff(this.previousState, newState, diffObj);
    this.previousState = newState;
    return diffObj;
  }

  public getEntity(id?: UUID): Entity | undefined {
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

  public isInBoundsPoint(pt: VectorLike): boolean {
    return this.boundingBox.containsPointXY(pt.x, pt.y);
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
    const vec = new Vector(1, 0);

    vec.angle = angle;
    vec.magnitude = stepSize;
    const {x: dx, y: dy} = vec;
    vec.set(from);

    while (
      traveled < maxDist &&
      hit.size < maxTargets &&
      this.isInBoundsPoint(vec)
    ) {
      // Check if we collide with any entities
      const querySet = new Set(this.queryPoint(vec));

      const candidates = Iterator.set(querySet).filter(validate);
      for (const candidate of candidates) {
        hit.add(candidate);
        if (hit.size >= maxTargets) {
          break;
        }
      }

      const hitWall = Iterator.set(querySet).any(
        (candidate) => candidate.collisionLayer === CollisionLayer.Geometry
      );
      if (hitWall) {
        break;
      }

      // Move cursor forwards
      vec.x += dx;
      vec.y += dy;
      traveled += stepSize;
    }

    return {
      hit,
      end: vec,
    };
  }

  public loadLevel(level: Data): void {
    const {boundingBox, geometry, friction = 1} = level;
    if (boundingBox && geometry) {
      // Erase previous geometry
      this.getEntities()
        .filter((entity) => entity.collisionLayer === CollisionLayer.Geometry)
        .forEach((entity) => entity.markForDelete());

      this.boundingBox.deserialize(boundingBox);
      this.boundingBox.centerX = 0;
      this.boundingBox.centerY = 0;
      this.friction = friction;

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

  public dataSerializeAll(): DataBuffer {
    // Compute size
    const size = this.getEntities()
      .filter((entity) => entity.doSync)
      .map((entity) => entity.dataSize())
      .fold(0, (sum, size) => sum + size);
    const buf = DataBuffer.writer(size);
    this.getEntities()
      .filter((entity) => entity.doSync)
      .forEach((entity) => entity.dataSerialize(buf));
    return buf;
  }
}

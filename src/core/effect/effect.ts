import {Data, Serializable} from 'core/serialize';
import {Unit, WorldManager} from 'core/entity';
import {Observer} from 'core/event';
import {isUUID, UUID, UUIDManager} from 'core/uuid';

export class Effect extends Observer implements Serializable {
  public static typeName: string = 'Effect';

  public type: string = Effect.typeName;
  public id: UUID;
  public target?: Unit;
  public source?: Unit;
  public duration?: number;
  public isMarkedForDelete: boolean = false;

  constructor() {
    super();
    this.id = UUIDManager.generate();
  }

  public override cleanup() {
    this.onEnd();
    super.cleanup();
    UUIDManager.free(this.id);
  }

  public kill() {
    this.isMarkedForDelete = true;
  }

  public step(dt: number) {
    if (this.duration === undefined) {
      return;
    }
    this.duration -= dt;
    if (this.duration <= 0) {
      this.kill();
    }
  }

  public serialize(): Data {
    return {
      id: this.id,
      type: this.type,
      targetId: this.target?.id,
      sourceId: this.source?.id,
      duration: this.duration,
    };
  }

  public deserialize(data: Data, _initialize?: boolean) {
    const {id, type, sourceId, targetId, duration} = data;
    if (isUUID(id)) {
      this.id = id;
    }
    if (typeof type === 'string') {
      this.type = type;
    }
    if (isUUID(sourceId)) {
      const source = WorldManager.getEntity(sourceId);
      if (source instanceof Unit) {
        this.source = source;
      }
    }
    if (isUUID(targetId)) {
      const target = WorldManager.getEntity(targetId);
      if (target instanceof Unit) {
        this.target = target;
      }
    }
    if (typeof duration === 'number') {
      this.duration = duration;
    }
  }

  protected onStart() {}

  protected onEnd() {}
}

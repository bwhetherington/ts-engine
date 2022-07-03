import {Data, Serializable} from '@/core/serialize';
import {Unit, WorldManager} from '@/core/entity';
import {EventManager, makeEventType, Observer} from '@/core/event';
import {isUUID, UUID, UUIDManager} from '@/core/uuid';

export interface SpawnEffectEvent {
  effect: Effect;
}
export const SpawnEffectEvent =
  makeEventType<SpawnEffectEvent>('SpawnEffectEvent');

export interface DeleteEffectEvent {
  effect: Effect;
}
export const DeleteEffectEvent =
  makeEventType<DeleteEffectEvent>('DeleteEffectEvent');

export class Effect extends Observer implements Serializable {
  public static typeName: string = 'Effect';

  public type: string = Effect.typeName;
  public name: string = this.type;
  public id: UUID;
  public target?: Unit;
  public source?: Unit;
  public duration?: number;
  public isBoon: boolean = false;
  public isMarkedForDelete: boolean = false;

  constructor() {
    super();
    this.id = UUIDManager.generate();

    EventManager.emitEvent(SpawnEffectEvent, {
      effect: this,
    });
  }

  public override cleanup() {
    this.onEnd();
    super.cleanup();
    UUIDManager.free(this.id);

    EventManager.emitEvent(DeleteEffectEvent, {
      effect: this,
    });
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
      name: this.name,
      targetId: this.target?.id,
      sourceId: this.source?.id,
      duration: this.duration,
      isBoon: this.isBoon,
    };
  }

  public deserialize(data: Data, _initialize?: boolean) {
    const {id, type, name, sourceId, targetId, duration, isBoon} = data;
    if (isUUID(id)) {
      this.id = id;
    }
    if (typeof type === 'string') {
      this.type = type;
    }
    if (typeof name === 'string') {
      this.name = name;
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
    if (typeof isBoon === 'boolean') {
      this.isBoon = isBoon;
    }
  }

  public onStart() {}

  public onEnd() {}
}

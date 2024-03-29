import {
  Handler,
  EventData,
  EventManager,
  StepEvent,
  Event,
  Priority,
  TypeId,
  getTypeId,
} from '@/core/event';
import {AsyncIterator, Iterator} from '@/core/iterator';
import {UUID} from '@/core/uuid';

export abstract class Observer {
  private handlers: Record<string, Set<UUID>> = {};
  private isCleanedUp: boolean = false;

  private getHandlers(type: string): Set<UUID> {
    let handlers = this.handlers[type];
    if (handlers === undefined) {
      handlers = new Set();
      this.handlers[type] = handlers;
    }
    return handlers;
  }

  public addListener<E extends EventData>(
    typeId: TypeId<E>,
    handler: Handler<E>,
    priority: Priority = Priority.Normal
  ): UUID {
    const type = getTypeId(typeId);
    const id = EventManager.addListener(type, handler, priority);
    this.getHandlers(type).add(id);
    return id;
  }

  public removeListener<E extends EventData>(typeId: TypeId<E>, id: UUID): boolean {
    const type = getTypeId(typeId);
    return (
      this.getHandlers(type)?.delete(id) &&
      EventManager.removeListener(type, id)
    );
  }

  public streamEvents<E extends EventData>(
    typeId: TypeId<E>,
    priority: Priority = Priority.Normal,
    allowExternal: boolean = false
  ): AsyncIterator<Event<E>> {
    let id: UUID;
    const type = getTypeId(typeId);
    const iter = AsyncIterator.from<Event<E>>(async ({$yield}) => {
      id = this.addListener<E>(
        type,
        async (event) => {
          await $yield(event);
        },
        priority
      );
    });
    iter.onComplete = () => {
      this.removeListener(type, id);
    };
    if (allowExternal) {
      return iter;
    } else {
      return iter.filter((event) => {
        const shouldAllow = event.socket === undefined || event.socket === -1;
        return shouldAllow;
      });
    }
  }

  public streamInterval(
    period: number,
    priority: Priority = Priority.Normal
  ): AsyncIterator<void> {
    return this.streamEvents(StepEvent, priority)
      .map(() => {})
      .debounce(period);
  }

  public cleanup() {
    Iterator.entries(this.handlers).forEach(([type, handlerSet]) => {
      for (const id of handlerSet) {
        EventManager.removeListener(type, id);
      }
    });
    this.isCleanedUp = true;
  }

  public async sleep(seconds: number): Promise<boolean> {
    await this.streamInterval(seconds)
      .take(1)
      .takeUntil(() => this.isCleanedUp)
      .drain();
    return !this.isCleanedUp;
  }
}

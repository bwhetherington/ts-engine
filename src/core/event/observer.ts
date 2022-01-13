import {
  Handler,
  EventData,
  EventManager,
  StepEvent,
  Event,
  Priority,
} from '@/core/event';
import {AsyncIterator, Iterator} from '@/core/iterator';
import {UUID} from '@/core/uuid';

export abstract class Observer {
  private handlers: Record<string, Set<UUID>> = {};

  private getHandlers(type: string): Set<UUID> {
    let handlers = this.handlers[type];
    if (handlers === undefined) {
      handlers = new Set();
      this.handlers[type] = handlers;
    }
    return handlers;
  }

  public addListener<E extends EventData>(
    type: string,
    handler: Handler<E>,
    priority: Priority = Priority.Normal
  ): UUID {
    const id = EventManager.addListener(type, handler, priority);
    this.getHandlers(type).add(id);
    return id;
  }

  public removeListener(type: string, id: UUID): boolean {
    return (
      this.getHandlers(type)?.delete(id) &&
      EventManager.removeListener(type, id)
    );
  }

  public streamEvents<E extends EventData>(
    type: string,
    priority: Priority = Priority.Normal,
    allowExternal: boolean = false
  ): AsyncIterator<Event<E>> {
    let id: UUID;
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
    return this.streamEvents<StepEvent>('StepEvent', priority)
      .map(() => {})
      .debounce(period);
  }

  public cleanup() {
    Iterator.entries(this.handlers).forEach(([type, handlerSet]) => {
      for (const id of handlerSet) {
        EventManager.removeListener(type, id);
      }
    });
  }
}

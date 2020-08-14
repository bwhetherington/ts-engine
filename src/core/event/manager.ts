import { Queue } from 'core/util/queue';
import { Event, GameEvent, GameHandler, Handler, EventData } from 'core/event';
import { UUIDManager } from 'core/uuid';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

export interface StepEvent {
  dt: number;
}

export class EventManager {
  private handlers: Record<string, Record<string, GameHandler>> = {};
  private events: Queue<GameEvent> = new Queue();
  private listenerCount: number = 0;

  public emit<E extends EventData>(event: Event<E>): void {
    this.events.enqueue(event);
  }

  private getHandlers(type: string): Record<string, GameHandler> {
    let handlers = this.handlers[type];
    if (handlers === undefined) {
      handlers = {};
      this.handlers[type] = handlers;
    }
    return handlers;
  }

  public getHandler(type: string, id: string): GameHandler | undefined {
    const handlers = this.handlers[type];
    if (handlers) {
      return handlers[id];
    }
  }

  public addListener<E extends EventData>(
    type: string,
    handler: Handler<E>
  ): string {
    const handlers = this.getHandlers(type);
    const id = UUIDManager.generate();
    handlers[id] = handler;
    this.listenerCount += 1;
    log.debug(`add listener ${type}[${id}]`);
    return id;
  }

  public removeListener(type: string, id: string): void {
    const handlers = this.getHandlers(type);
    if (id in handlers) {
      this.listenerCount -= 1;
      delete handlers[id];
      UUIDManager.free(id);
      log.debug(`remove listener ${type}[${id}]`);
    } else {
      log.warn(`failed to remove listener ${type}[${id}]`);
    }
  }

  private handleEvent(event: GameEvent): void {
    // Check handlers
    const { type } = event;
    const handlers = this.handlers[type];
    if (handlers !== undefined) {
      for (const id in handlers) {
        handlers[id](event, id);
      }
    }
  }

  public pollEvents(): void {
    while (this.events.size() > 0) {
      const event = this.events.dequeue();
      if (event !== undefined) {
        this.handleEvent(event);
      }
    }
  }

  public step(dt: number): void {
    const event = {
      type: 'StepEvent',
      data: { dt },
    };
    this.emit(event);
    this.pollEvents();
  }

  public getListenerCount(): number {
    return this.listenerCount;
  }
}

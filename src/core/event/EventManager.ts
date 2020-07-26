import { Queue } from 'core/util/queue';
import { GameEvent, GameHandler, Handler, EventData } from 'core/event';
import { v1 as genUuid } from 'uuid';

export interface StepEvent {
  dt: number;
}

export class EventManager {
  private handlers: Record<string, Record<string, GameHandler>> = {};
  private events: Queue<GameEvent> = new Queue();

  public emit<E extends GameEvent>(event: E): void {
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
    const id = genUuid();
    handlers[id] = handler;
    return id;
  }

  public removeListener(type: string, id: string): void {
    const handlers = this.getHandlers(type);
    delete handlers[id];
  }

  private handleEvent(event: GameEvent): void {
    // Check handlers
    const { type } = event;
    const handlers = this.handlers[type];
    if (handlers !== undefined) {
      for (const id in handlers) {
        handlers[id](event);
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
}

import { Queue } from 'core/util/queue';
import { GameEvent } from 'core/event';

type Handler = (arg: any) => void;

export interface StepEvent {
  dt: number;
}

export class EventManager {
  private handlers: Record<string, Handler[]> = {};
  private events: Queue<GameEvent> = new Queue();

  public emit<E extends GameEvent>(event: E): void {
    this.events.enqueue(event);
  }

  private getHandlers(type: string): Handler[] {
    let handlers = this.handlers[type];
    if (handlers === undefined) {
      handlers = [];
      this.handlers[type] = handlers;
    }
    return handlers;
  }

  public addListener(
    type: string,
    handler: Handler
  ): void {
    const handlers = this.getHandlers(type);
    handlers.push(handler);
  }

  private handleEvent(event: GameEvent): void {
    // Check handlers
    const { type } = event;
    const handlers = this.handlers[type];
    if (handlers !== undefined) {
      for (const handler of handlers) {
        handler(event);
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

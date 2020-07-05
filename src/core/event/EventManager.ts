import { Queue } from 'core/util/queue';
import { GameEvent, EventData } from 'core/event';

type Proc<T> = (arg: T) => void;

type Handler = Proc<GameEvent>;

function convertHandler<E extends EventData>(handler: Proc<E>): Handler {
  return (event) => {
    handler(event.data as E);
  };
}

export interface StepEvent {
  dt: number;
}

export class EventManager {
  private handlers: Record<string, Handler[]> = {};
  private events: Queue<GameEvent> = new Queue();

  public registerEventType<T extends GameEvent>(
    type: T,
    check: (x: T) => x is T
  ) {}

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

  public addListener<E extends EventData>(
    type: string,
    handler: Proc<E>
  ): void {
    const converted = convertHandler(handler);
    const handlers = this.getHandlers(type);
    handlers.push(converted);
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

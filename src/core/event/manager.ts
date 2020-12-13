import { Queue } from 'core/util/queue';
import { Event, GameEvent, GameHandler, Handler, EventData } from 'core/event';
import { UUID, UUIDManager } from 'core/uuid';
import { LogManager } from 'core/log';
import { formatData } from 'core/util';
import { AsyncIterator } from 'core/iterator';

const log = LogManager.forFile(__filename);

export interface StepEvent {
  dt: number;
}

export class EventManager {
  private handlers: Record<string, Record<string, GameHandler>> = {};
  private events: Queue<GameEvent> = new Queue();
  private listenerCount: number = 0;
  public timeElapsed: number = 0;
  public stepCount: number = 0;

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
    log.trace(`add listener ${type}[${id}]`);
    return id;
  }

  public removeListener(type: string, id: string): boolean {
    const handlers = this.getHandlers(type);
    if (id in handlers) {
      this.listenerCount -= 1;
      delete handlers[id];
      UUIDManager.free(id);
      log.trace(`remove listener ${type}[${id}]`);
      return true;
    } else {
      log.warn(`failed to remove listener ${type}[${id}]`);
      return false;
    }
  }

  private handleEvent(event: GameEvent): void {
    // Check handlers
    const { type } = event;
    log.trace(`handle event: ${formatData(event)}`);
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
    this.timeElapsed += dt;
    this.stepCount += 1;
  }

  public getListenerCount(): number {
    return this.listenerCount;
  }

  public sleep(time: number): Promise<void> {
    return new Promise((resolve) => {
      let passed = 0;
      this.addListener<StepEvent>('StepEvent', (event, id) => {
        passed += event.data.dt;
        if (passed >= time) {
          this.removeListener('StepEvent', id);
          resolve();
        }
      });
    });
  }

  public runPeriodic(period: number, action: () => void): UUID {
    let passed = 0;
    return this.addListener<StepEvent>('StepEvent', (event) => {
      passed += event.data.dt;
      while (passed >= period) {
        passed -= period;
        action();
      }
    });
  }

  public streamEvents<E extends EventData>(type: string, addListener?: (type: string, handler?: Handler<E>) => void): AsyncIterator<Event<E>> {
    return AsyncIterator.from(($yield) => {
      (addListener ?? this.addListener)(type, $yield);
    });
  }
}

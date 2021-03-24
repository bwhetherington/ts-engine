import {Queue} from 'core/util/queue';
import {
  Event,
  GameEvent,
  GameHandler,
  Handler,
  EventData,
  PlayerEvent,
  Priority,
} from 'core/event';
import {UUID, UUIDManager} from 'core/uuid';
import {LogManager} from 'core/log';
import {formatData} from 'core/util';
import {AsyncIterator, Iterator} from 'core/iterator';
import {PlayerManager} from 'core/player';

const log = LogManager.forFile(__filename);

export interface StepEvent {
  dt: number;
}

type GameHandlers = Record<UUID, GameHandler>[];

export class EventManager {
  private handlers: Record<string, GameHandlers> = {};
  private events: Queue<GameEvent> = new Queue();
  private listenerCount: number = 0;
  public timeElapsed: number = 0;
  public stepCount: number = 0;

  private isPropagationCanceled: boolean = false;

  public emit<E extends EventData>(event: Event<E>): void {
    this.events.enqueue(event);
  }

  private getHandlers(type: string): GameHandlers {
    let handlers = this.handlers[type];
    if (handlers === undefined) {
      handlers = [];

      for (let i = Priority.Highest; i <= Priority.Lowest; i++) {
        handlers[i] = {};
      }

      this.handlers[type] = handlers;
    }
    return handlers;
  }

  public stopPropagation(): void {
    this.isPropagationCanceled = true;
  }

  public addListener<E extends EventData>(
    type: string,
    handler: Handler<E>,
    priority: Priority = Priority.Normal
  ): UUID {
    const handlers = this.getHandlers(type);
    const id = UUIDManager.generate();
    handlers[priority][id] = handler;
    this.listenerCount += 1;
    log.trace(`add listener ${type}[${id}]`);
    return id;
  }

  public removeListener(type: string, id: UUID): boolean {
    const handlers = this.getHandlers(type);
    for (let i = Priority.Highest; i <= Priority.Lowest; i++) {
      const priorityHandlers = handlers[i];
      if (id in priorityHandlers) {
        this.listenerCount -= 1;
        delete priorityHandlers[id];
        UUIDManager.free(id);
        log.trace(`remove listener ${type}[${id}]`);
        return true;
      }
    }
    log.warn(`failed to remove listener ${type}[${id}]`);
    return false;
  }

  private async handleEvent(event: GameEvent): Promise<void> {
    // Check handlers
    this.isPropagationCanceled = false;

    const {type} = event;
    log.trace(`handle event: ${formatData(event)}`);
    const handlers = this.handlers[type];
    if (handlers !== undefined) {
      for (
        let priority = Priority.Highest;
        priority <= Priority.Lowest;
        priority++
      ) {
        for (const id in handlers[priority]) {
          // Check if the event has been canceled
          if (this.isPropagationCanceled) {
            return;
          }

          const handler = handlers[priority][id];
          await handler(event, UUIDManager.from(id));
        }
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
    this.emit<StepEvent>({
      type: 'StepEvent',
      data: {dt},
    });
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

  public streamEvents<E extends EventData>(
    type: string,
    priority: Priority = Priority.Normal
  ): AsyncIterator<Event<E>> {
    let id: number;
    const iter = AsyncIterator.from<Event<E>>(async ({$yield}) => {
      id = this.addListener<E>(type, $yield, priority);
    });
    iter.onComplete = () => {
      this.removeListener(type, id);
    };
    return iter;
  }

  public streamInterval(
    period: number,
    priority: Priority = Priority.Normal
  ): AsyncIterator<void> {
    return this.streamEvents<StepEvent>('StepEvent', priority)
      .map(() => {})
      .debounce(period);
  }

  public streamEventsForPlayer<E extends EventData>(
    type: string,
    priority: Priority = Priority.Normal
  ): AsyncIterator<PlayerEvent<E>> {
    return this.streamEvents<E>(type, priority).filterMap(
      ({data, socket, type}) => {
        const player = PlayerManager.getSocket(socket);
        return player ? {data, player, type} : undefined;
      }
    );
  }
}

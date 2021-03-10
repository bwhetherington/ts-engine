import {EventData, EventManager, Handler, Event, StepEvent} from 'core/event';
import {AsyncIterator, iterateKeys} from 'core/iterator';
import {Props} from 'client/components';
import React from 'react';
import {UUID, UUIDManager} from 'core/uuid';

type Handlers = Readonly<Record<string, Readonly<string[]>>>;

interface ComponentState {
  handlers: Handlers;
}

export class Component<P = {}, S = {}> extends React.Component<
  Props<P>,
  S & ComponentState
> {
  public constructor(props: Props<P>, initialState: S) {
    super(props);
    this.initializeState(initialState);
  }

  protected static defaultState: ComponentState = {
    handlers: {},
  };

  private initializeState(state: S): void {
    this.state = {
      ...state,
      handlers: {},
    };
  }

  protected updateState(newState: Partial<S | ComponentState>): Promise<void> {
    return new Promise((resolve) => {
      this.setState(
        {
          ...this.state,
          ...newState,
        },
        resolve
      );
    });
  }

  protected addListener<E extends EventData>(
    type: string,
    handler: Handler<E>
  ): UUID {
    const id = EventManager.addListener(type, handler);
    const oldList = this.state.handlers[type] ?? [];
    const newList = [id, ...oldList];
    const newHandlers = {...this.state.handlers, [type]: newList};
    this.updateState({
      handlers: newHandlers,
    });
    return id;
  }

  public async removeListener(type: string, id: UUID): Promise<void> {
    const newList = this.state.handlers[type].filter((id) => id !== id);
    EventManager.removeListener(type, id);
    await this.updateState({
      handlers: {
        ...this.state.handlers,
        [type]: newList,
      },
    });
  }

  public streamEvents<E extends EventData>(
    type: string
  ): AsyncIterator<Event<E>> {
    let id: UUID;
    const iter = AsyncIterator.from<Event<E>>(async ({$yield}) => {
      id = this.addListener<E>(type, async (event) => {
        await $yield(event);
      });
    });
    iter.onComplete = async () => {
      this.removeListener(type, id);
    };
    return iter;
  }

  public componentWillUnmount(): void {
    // Unregister all listeners
    iterateKeys(this.state.handlers).forEach((type) => {
      for (const index of this.state.handlers[type]) {
        const id = UUIDManager.from(index);
        EventManager.removeListener(type, id);
      }
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

  public streamInterval(period: number): AsyncIterator<void> {
    return AsyncIterator.from(({$yield}) => {
      this.runPeriodic(period, () => $yield());
    });
  }
}

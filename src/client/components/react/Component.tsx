import { EventData, EventManager, Handler, Event, StepEvent } from 'core/event';
import { AsyncIterator, iterateKeys } from 'core/iterator';
import { Props } from 'client/components/react';
import React from 'react';
import { UUID } from 'core/uuid';

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

  protected updateState(newState: Partial<S | ComponentState>): void {
    this.setState({
      ...this.state,
      ...newState,
    });
  }

  protected addListener<E extends EventData>(
    type: string,
    handler: Handler<E>
  ): string {
    const id = EventManager.addListener(type, handler);
    const oldList = this.state.handlers[type] ?? [];
    const newList = [id, ...oldList];
    const newHandlers = { ...this.state.handlers, [type]: newList };
    this.updateState({
      handlers: newHandlers,
    });
    return id;
  }

  protected streamEvents<E extends EventData>(
    type: string
  ): AsyncIterator<Event<E>> {
    return AsyncIterator.from(({ $yield }) => {
      this.addListener<E>(type, $yield);
    });
  }

  public componentWillUnmount(): void {
    // Unregister all listeners
    iterateKeys(this.state.handlers).forEach((type) => {
      for (const id of this.state.handlers[type]) {
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
    return AsyncIterator.from(({ $yield }) => {
      this.runPeriodic(period, () => $yield());
    });
  }  
}

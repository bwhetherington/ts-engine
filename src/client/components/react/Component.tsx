import { EventData, EventManager, GameEvent, Handler } from 'core/event';
import { iterateKeys } from 'core/iterator';
import { UUID } from 'core/uuid';
import React from 'react';

type Handlers = Readonly<Record<string, Readonly<string[]>>>;

interface ComponentState {
  handlers: Handlers;
}

export class Component<P = {}, S = {}> extends React.Component<
  P,
  S & ComponentState
> {
  public constructor(props: P, initialState: S) {
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
  ) {
    const id = EventManager.addListener(type, handler);
    const oldList = this.state.handlers[type] ?? [];
    const newList = [id, ...oldList];
    const newHandlers = { ...this.state.handlers, [type]: newList };
    this.updateState({
      handlers: newHandlers,
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
}

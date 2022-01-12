import {Iterator} from '@/core/iterator';

type MaybePromise<T> = T | Promise<T>;

export type StateTransition<S, A> = {
  from: S;
  to: S;
  action: A;
};

export class StateMachine<S extends number, A extends number> {
  private currentState: S;
  private transitions: StateTransition<S, A>[];
  private actions: Record<number, () => MaybePromise<void>> = {};

  public constructor(
    initialState: S,
    transitions: StateTransition<S, A>[],
    actions: Record<number, () => void>
  ) {
    this.currentState = initialState;
    this.transitions = transitions;
    this.actions = actions;
  }

  public canTransitionWith(action: A): boolean {
    return Iterator.from(this.transitions)
      .filter((transition) => transition.from === this.currentState)
      .any((transition) => transition.action === action);
  }

  public canTransitionTo(state: S): boolean {
    return Iterator.from(this.transitions)
      .filter((transition) => transition.from === this.currentState)
      .any((transition) => transition.to === state);
  }

  private getNextState(action: A): S | undefined {
    return Iterator.from(this.transitions)
      .filter(
        (transition) =>
          transition.from === this.currentState && transition.action === action
      )
      .map((transition) => transition.to)
      .first();
  }

  public async transition(action: A): Promise<boolean> {
    const nextState = this.getNextState(action);
    if (nextState) {
      const fn = this.actions[action];
      await fn?.();
      this.currentState = nextState;
      return true;
    } else {
      return false;
    }
  }

  public getState(): S {
    return this.currentState;
  }
}

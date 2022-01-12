import {EventManager} from 'core/event';
import {StateMachine} from 'core/fsm';
import {AsyncIterator} from 'core/iterator';
import {Data} from 'core/serialize';
import {ChatManager} from 'server/chat';
import {Server} from 'server/net';
import {Plugin} from 'server/plugin';

interface TransitionEvent<A> {
  action: A;
}

export abstract class FsmPlugin<
  S extends number,
  A extends number
> extends Plugin {
  public static typeName: string = 'SoccerPlugin';

  private transitionEventName: string = '';

  private machine: StateMachine<S, A> = this.createMachine();

  protected async countdown(
    state: S,
    total: number,
    points: number[]
  ): Promise<boolean> {
    let timeSlept = 0;
    for (const point of points) {
      const timeToSleep = total - timeSlept - point;
      await EventManager.sleep(timeToSleep);
      if (this.machine.getState() !== state) {
        return false;
      }
      ChatManager.info(`${point} seconds remaining`);
      timeSlept += timeToSleep;
    }
    await EventManager.sleep(total - timeSlept);
    return this.machine.getState() === state;
  }

  protected abstract createMachine(): StateMachine<S, A>;

  protected takeDuringState<T>(
    state: S,
    iterator: AsyncIterator<T>
  ): AsyncIterator<T> {
    return iterator
      .join(this.streamEvents<TransitionEvent<A>>(this.transitionEventName))
      .takeWhile(() => this.machine.getState() === state)
      .filter((val) => {
        return !(val && (val as Data).type === this.transitionEventName);
      })
      .map((val) => val as T);
  }

  protected async transition(action: A): Promise<void> {
    await this.machine.transition(action);
    EventManager.emit<TransitionEvent<A>>({
      type: this.transitionEventName,
      data: {
        action,
      },
    });
  }

  protected getState(): S {
    return this.machine.getState();
  }

  public async initialize(server: Server): Promise<void> {
    this.transitionEventName = this.name + 'Transition';
    await super.initialize(server);
  }
}

import {Server} from 'server/net';
import {Plugin} from 'server/plugin';
import {
  GameStateMachine,
  gameStateMachine,
  GameState,
  GameAction,
} from 'server/plugin/game/machine';

export class GamePlugin extends Plugin {
  private machine?: GameStateMachine;

  public async initialize(server: Server): Promise<void> {
    this.machine = gameStateMachine(this);
    this.machine?.transition(GameAction.Start);
  }

  public async cleanup(): Promise<void> {
    this.machine?.transition(GameAction.Stop);
  }
}

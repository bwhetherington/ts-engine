import {LogManager} from 'core/log';
import {StateMachine} from 'core/fsm';

const log = LogManager.forFile(__filename);

export enum GameState {
  Starting,
  Running,
  Stopping,
}

export enum GameAction {
  Start,
  Stop,
}

export const gameStateMachine = new StateMachine(
  GameState.Starting,
  [
    {
      from: GameState.Starting,
      to: GameState.Running,
      action: GameAction.Start,
    },
    {
      from: GameState.Running,
      to: GameState.Stopping,
      action: GameAction.Stop,
    },
  ],
  {
    [GameAction.Start]: () => {
      log.info('start game');
    },
    [GameAction.Stop]: () => {
      log.info('stop game');
    },
  }
);

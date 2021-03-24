import {LogManager} from 'core/log';
import {StateMachine} from 'core/fsm';

import {Plugin} from 'server/plugin';
import {Unit, WorldManager} from 'core/entity';

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

export type GameStateMachine = StateMachine<GameState, GameAction>;

export function gameStateMachine(plugin: Plugin): GameStateMachine {
  return new StateMachine(
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

        // Spawn players
        plugin.streamInterval(5).forEach(() => console.log('Hello!'));
      },
      [GameAction.Stop]: () => {
        log.info('stop game');

        // Remove all units
        WorldManager.getEntities()
          .filter((entity) => entity instanceof Unit)
          .forEach((entity) => entity.markForDelete());
      },
    }
  );
}

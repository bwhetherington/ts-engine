import {
  BaseHero,
  Feed,
  FeedVariant,
  KillEvent,
  Unit,
  WorldManager,
} from 'core/entity';
import {EventManager} from 'core/event';
import {StateMachine} from 'core/fsm';
import {randomColor} from 'core/graphics';
import {AsyncIterator} from 'core/iterator';
import {PlayerJoinEvent, PlayerManager} from 'core/player';
import {RNGManager} from 'core/random';
import {Data} from 'core/serialize';
import {ChatManager} from 'server/chat';
import {Server} from 'server/net';
import {Plugin} from 'server/plugin';

export enum GameState {
  Starting,
  Running,
  Stopping,
}

export enum GameAction {
  Start,
  Stop,
}

interface GameTransitionEvent {
  action: GameAction;
}

export type GameStateMachine = StateMachine<GameState, GameAction>;

export class GamePlugin extends Plugin {
  public static typeName: string = 'GamePlugin';

  private machine: GameStateMachine = this.createMachine();

  private spawnFeed(): void {
    const num = RNGManager.nextFloat(0, 1);
    const position = WorldManager.getRandomPosition();
    let size;
    if (num < 0.2) {
      size = FeedVariant.Large;
    } else if (num < 0.5) {
      size = FeedVariant.Medium;
    } else {
      size = FeedVariant.Small;
    }
    const entity = WorldManager.spawnEntity('Feed', position) as Feed;
    entity.setVariant(size);
  }

  private spawnEnemy(): void {
    // Create enemy
    const position = WorldManager.getRandomPosition();

    const type = RNGManager.nextEntry([
      'Enemy',
      'Enemy',
      'Enemy',
      'HomingEnemy',
      'HomingEnemy',
      'HeavyEnemy',
    ]);
    const enemy = WorldManager.spawnEntity(type, position);

    // Pick color
    enemy.setColor(randomColor());
  }

  private async countdown(state: GameState, total: number, points: number[]): Promise<boolean> {
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

  private createMachine(): GameStateMachine {
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
        {
          from: GameState.Stopping,
          to: GameState.Running,
          action: GameAction.Start,
        },
      ],
      {
        [GameAction.Start]: async () => {
          ChatManager.info('Starting the game');

          // Spawn feed units
          this.takeDuringState(GameState.Running, this.streamInterval(1))
            .filter(() => WorldManager.getUnitCount() < 30 && RNGManager.nextBoolean(1 / 2.5))
            .forEach(() => {
              this.spawnFeed();
            });

          // Spawn enemy units
          this.takeDuringState(GameState.Running, this.streamInterval(1))
            .filter(() => WorldManager.getUnitCount() < 30 && RNGManager.nextBoolean(1 / 5))
            .forEach(() => {
              this.spawnEnemy();
            });

          const respawnHero = async (hero: BaseHero) => {
            const player = hero.getPlayer();
            if (player) {
              player.reset();
              await EventManager.sleep(3);
              if (this.machine.getState() === GameState.Running) {
                player.spawnHero();
              }
            }
          };

          // Respawn players
          this.takeDuringState(GameState.Running, this.streamEvents<KillEvent>('KillEvent'))
            .filterMap((event) => {
              const entity = WorldManager.getEntity(event.data.targetID);
              return entity instanceof BaseHero ? entity : undefined;
            })
            .forEach((hero) => {
              respawnHero(hero);
            });

          // Spawn units for joining players
          this.takeDuringState(GameState.Running, this.streamEvents<PlayerJoinEvent>('PlayerJoinEvent'))
            .map((event) => event.data.player)
            .forEach((player) => {
              player.spawnHero();
            });

          // Spawn units for existing players
          PlayerManager.getPlayers().forEach((player) => player.spawnHero());

          // Start timer
          this.countdown(GameState.Running, 300, [60, 30, 15, 10, 5, 4, 3, 2, 1])
            .then((shouldTransition) => {
              if (shouldTransition) {
                this.transition(GameAction.Stop);
              }
            });
        },
        [GameAction.Stop]: async () => {
          ChatManager.info('Stopping the game');

          WorldManager.getEntities()
            .filterMap((entity) =>
              entity instanceof Unit ? entity : undefined
            )
            .forEach((unit) => unit.kill());

          PlayerManager.getPlayers().forEach((player) => player.reset());

          (async () => {
            await EventManager.sleep(5);
            this.transition(GameAction.Start);
          })();
        },
      }
    );
  }

  private takeDuringState<T>(state: GameState, iterator: AsyncIterator<T>): AsyncIterator<T> {
    return iterator.join(this.streamEvents<GameTransitionEvent>('GameTransitionEvent'))
      .takeWhile(() => this.machine.getState() === state)
      .filter((val) => {
        return !(val && (val as Data).type === 'GameTransitionEvent');
      })
      .map((val) => val as T);
  }

  private async transition(action: GameAction): Promise<void> {
    await this.machine.transition(action);
    EventManager.emit<GameTransitionEvent>({
      type: 'GameTransitionEvent',
      data: {
        action,
      },
    });
  }

  public override async initialize(server: Server): Promise<void> {
    const stopHandler = async () => {
      await this.transition(GameAction.Stop);
      console.log('stopped');
    };
    this.registerCommand({
      name: 'stopGame',
      help: 'Stops the current game',
      handler: stopHandler,
    });

    const startHandler = async () => {
      ChatManager.info('startHandler');
      await this.transition(GameAction.Start);
    };

    this.registerCommand({
      name: 'startGame',
      help: 'Starts the current game',
      handler: startHandler,
    });

    await this.machine.transition(GameAction.Start);
    await super.initialize(server);
  }

  public async override cleanup(): Promise<void> {
    await this.machine.transition(GameAction.Stop);
    await super.cleanup();
  }
}

import {
  BaseHero,
  Enemy,
  Feed,
  FeedVariant,
  KillEvent,
  Unit,
  WorldManager,
} from 'core/entity';
import {EventManager, Priority} from 'core/event';
import {StateMachine} from 'core/fsm';
import {Vector} from 'core/geometry';
import {COLORS, randomColor} from 'core/graphics';
import {PlayerJoinEvent, PlayerManager} from 'core/player';
import {RNGManager} from 'core/random';
import {ChatManager} from 'server/chat';
import {Server} from 'server/net';
import {FsmPlugin} from 'server/plugin';

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

export class GamePlugin extends FsmPlugin<GameState, GameAction> {
  public static typeName: string = 'GamePlugin';

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
    const entity = WorldManager.spawnEntity('Feed') as Feed | undefined;
    entity?.setPosition(position);
    entity?.setVariant(size);
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
    const enemy = WorldManager.spawnEntity(type);
    enemy?.setPosition(position);

    // Pick color
    enemy?.setColor(randomColor());
  }

  private startGame(): void {
    ChatManager.info('Starting the game');
    // Spawn feed units
    this.takeDuringState(GameState.Running, this.streamInterval(1))
      .filter(
        () =>
          WorldManager.getUnitCount() < 30 && RNGManager.nextBoolean(1 / 2.5)
      )
      .forEach(() => {
        this.spawnFeed();
      });

    // Spawn enemy units
    this.takeDuringState(GameState.Running, this.streamInterval(1))
      .filter(
        () => WorldManager.getUnitCount() < 30 && RNGManager.nextBoolean(1 / 5)
      )
      .forEach(() => {
        this.spawnEnemy();
      });

    const respawnHero = async (hero: BaseHero) => {
      const player = hero.getPlayer();
      if (player) {
        player.reset();
        await EventManager.sleep(3);
        if (this.getState() === GameState.Running) {
          player.spawnHero();
        }
      }
    };

    // this.streamEvents<KillEvent>('KillEvent')

    // Respawn players
    this.streamEvents<KillEvent>('KillEvent')
      .filterMap((event) => {
        return PlayerManager.getPlayers().map((player) => {
          const {hero} = player;
          if (hero && hero.id === event.data.targetID) {
            return hero;
          }
        }).first();
      })
      .forEach((hero) => {
        respawnHero(hero);
      });

    // Spawn units for joining players
    this.takeDuringState(
      GameState.Running,
      this.streamEvents<PlayerJoinEvent>('PlayerJoinEvent')
    )
      .map((event) => event.data.player)
      .forEach((player) => {
        player.spawnHero();
      });

    // Spawn units for existing players
    PlayerManager.getPlayers().forEach((player) => player.spawnHero());

    // Start timer
    this.countdown(GameState.Running, 300, [
      60,
      30,
      10,
      9,
      8,
      7,
      6,
      5,
      4,
      3,
      2,
      1,
    ]).then((shouldTransition) => {
      if (shouldTransition) {
        this.transition(GameAction.Stop);
      }
    });
  }

  private stopGame(): void {
    ChatManager.info('Stopping the game');

    WorldManager.getEntities()
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .forEach((unit) => unit.kill());

    PlayerManager.getPlayers().forEach((player) => player.reset());

    (async () => {
      await EventManager.sleep(5);
      this.transition(GameAction.Start);
    })();
  }

  protected createMachine(): GameStateMachine {
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
        [GameAction.Start]: this.startGame.bind(this),
        [GameAction.Stop]: this.stopGame.bind(this),
      }
    );
  }

  public async initialize(server: Server): Promise<void> {
    await super.initialize(server);

    const stopHandler = async () => {
      await this.transition(GameAction.Stop);
    };
    this.registerCommand({
      name: 'stopGame',
      help: 'Stops the current game',
      handler: stopHandler,
    });

    this.registerCommand({
      name: 'spawnColors',
      help: 'Spawns tanks with the current color palette',
      handler() {
        const {width, x, y} = WorldManager.boundingBox;
        const num = COLORS.length;

        const indent = 30;
        const usableWidth = width - 2 * indent;
        const spacing = usableWidth / (num - 1);

        for (let i = 0; i < num; i++) {
          const color = {...COLORS[i]};
          const posX = x + indent + spacing * i;
          const posY = y + indent;
          const tank = WorldManager.spawn(Enemy, new Vector(posX, posY));
          if (!tank) {
            continue;
          }
          tank.setName('' + (1 + i));
          tank.isActive = false;
          tank.weaponAngle = Math.PI / 2;
          tank.setColor(color);
        }
      },
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

    this.registerCommand({
      name: 'force',
      help: 'Applies a force to your character',
      handler(player, amount) {
        const hero = player.hero;
        if (amount && hero) {
          const amountNumber = parseFloat(amount);
          hero.applyForce(new Vector(amountNumber, 0));
        }
      },
    });

    await this.transition(GameAction.Start);
  }

  public async cleanup(): Promise<void> {
    await this.transition(GameAction.Stop);
    await super.cleanup();
  }
}

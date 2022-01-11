import {AlertEvent} from 'core/alert';
import {AlertManager} from 'core/alert';
import {
  BaseHero,
  DamageEvent,
  BaseEnemy,
  Feed,
  FeedVariant,
  KillEvent,
  Projectile,
  Unit,
  WorldManager,
  SpawnEntityEvent,
  Team,
  Tank,
} from 'core/entity';
import {EventManager, Priority} from 'core/event';
import {StateMachine} from 'core/fsm';
import {Vector} from 'core/geometry';
import {COLORS, randomColor} from 'core/graphics';
import {Iterator} from 'core/iterator';
import {NetworkManager} from 'core/net';
import {PlayerJoinEvent, PlayerManager} from 'core/player';
import {RNGManager} from 'core/random';
import { HeroModifier } from 'core/upgrade';
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

const ENEMY_COSTS: Record<string, number> = {
  Enemy: 10,
  HeavyEnemy: 20,
  HomingEnemy: 15,
  SwarmEnemy: 20,
  SmallEnemy: 5,
};

const ENEMY_TYPES = Object.keys(ENEMY_COSTS);

const MIN_BUDGET = Iterator.values(ENEMY_COSTS).fold(
  Number.POSITIVE_INFINITY,
  Math.min
);

export type GameStateMachine = StateMachine<GameState, GameAction>;

const NPC_DAMAGE_MULTIPLIER = 0.5;

const MAX_ATTEMPTS = 1000;

export class GamePlugin extends FsmPlugin<GameState, GameAction> {
  public static typeName: string = 'GamePlugin';

  private wave: number = 0;
  private globalModifier: HeroModifier = new HeroModifier({
    damage: -0.5,
    rate: -0.5,
  });
  private isWaiting: boolean = false;

  private spawnFeed() {
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

  private getWaveBudget(): number {
    return this.wave * 2.5 + 10;
  }

  public buildWave(budget: number): string[] {
    const wave = [];
    const sample = RNGManager.sample(ENEMY_TYPES, true)
      .map((type) => [type, ENEMY_COSTS[type] ?? MIN_BUDGET] as const)
      .takeWhile(() => budget >= MIN_BUDGET);
    for (const [type, cost] of sample) {
      if (cost <= budget) {
        wave.push(type);
        budget -= cost;
      }
    }
    return wave;
  }

  private async spawnWave() {
    this.isWaiting = true;
    await EventManager.sleep(3);
    const numPlayers = this.getTeamCount(Team.Blue);
    const budget = this.getWaveBudget() * numPlayers;
    const wave = this.buildWave(budget);
    for (const enemy of wave) {
      this.spawnEnemy(enemy, Team.Red);
    }
    this.setWave(this.wave + 1);
    this.isWaiting = false;
  }

  private setWave(wave: number) {
    this.wave = wave;
    const damageModifier = wave / 30 - 0.5;
    this.globalModifier.set('damage', damageModifier);
  }

  private spawnEnemy(type: string, team: Team) {
    // Create enemy
    const position = WorldManager.getRandomPosition();
    const enemy = WorldManager.spawnEntity(type);

    if (!(enemy instanceof Tank)) {
      return;
    }

    enemy.modifiers.compose(this.globalModifier);

    enemy.setPosition(position);

    if (team !== undefined) {
      enemy.setTeam(team);
    } else {
      // Pick color
      enemy.setColor(randomColor());
    }
  }

  private getTeamCount(team: Team): number {
    return WorldManager.getEntities()
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .filter((unit) => unit.team === team && unit.getXPWorth() > 0)
      .count();
  }

  private startGame() {
    ChatManager.info('Starting the game');

    this.setWave(0);

    this.takeDuringState(
      GameState.Running,
      this.streamEvents<KillEvent>('KillEvent')
    ).forEach((event) => {
      const {target, source} = event.data;
      if (!(target instanceof BaseHero && source instanceof Unit)) {
        return;
      }
      AlertManager.send(
        `${target.getName()} was killed by ${source.getName()}`
      );
    });

    // Spawn enemy units
    this.takeDuringState(GameState.Running, this.streamInterval(1))
      .filter(() => !this.isWaiting)
      // Only spawn when there are players
      .filter(() => this.getTeamCount(Team.Blue) > 0)
      // Only spawn a new wave when the previous wave is fully defeated
      .filter(() => this.getTeamCount(Team.Red) === 0)
      .forEach(() => {
        this.spawnWave().then(() => {
          AlertManager.send(`Spawning wave ${this.wave}...`);
        });
      });

    // Reset if all players are dead
    const onKillEvent = this.streamEvents<KillEvent>('KillEvent');
    this.takeDuringState(GameState.Running, onKillEvent)
      .filter(() => this.getTeamCount(Team.Blue) === 0)
      .forEach(() => {
        AlertManager.send('Resetting game...');
        this.transition(GameAction.Stop);
      });

    const respawnHero = async (hero: BaseHero) => {
      const player = hero.getPlayer();
      if (player) {
        player.reset();
        await EventManager.sleep(3);
        if (this.getState() === GameState.Running) {
          player.spawnHero();
          player.hero?.setTeam(Team.Blue);
        }
      }
    };

    // Respawn players
    this.takeDuringState(
      GameState.Running,
      this.streamEvents<KillEvent>('KillEvent')
    )
      .filterMap((event) => {
        return PlayerManager.getPlayers()
          .map((player) => {
            const {hero} = player;
            if (hero?.id === event.data.targetID) {
              return hero;
            }
          })
          .first();
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
        player.hero?.setTeam(Team.Blue);
      });

    // Spawn units for existing players
    PlayerManager.getPlayers().forEach((player) => {
      player.spawnHero();
      player.hero?.setTeam(Team.Blue);
    });
  }

  private stopGame() {
    ChatManager.info('Stopping the game');

    WorldManager.getEntities()
      .filterMap((entity) =>
        entity instanceof Unit || entity instanceof Projectile
          ? entity
          : undefined
      )
      .forEach((entity) => entity.markForDelete());

    PlayerManager.getPlayers().forEach((player) => player.reset());

    this.wave = 0;
    this.isWaiting = false;

    EventManager.sleep(5).then(() => {
      this.transition(GameAction.Start);
    });
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

    this.registerCommand({
      name: 'level',
      help: 'Level up',
      handler(player, xp) {
        if (xp === undefined) {
          return;
        }

        const xpNum = parseInt(xp);
        if (Number.isNaN(xpNum)) {
          return;
        }

        const hero = player.hero;
        if (!hero) {
          return;
        }

        hero.setExperience(xpNum, true);
      },
    });

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
          const tank = WorldManager.spawn(BaseEnemy, new Vector(posX, posY));
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

    await WorldManager.setLevel('arena');

    await this.transition(GameAction.Start);
  }

  public async cleanup(): Promise<void> {
    await this.transition(GameAction.Stop);
    await super.cleanup();
  }
}

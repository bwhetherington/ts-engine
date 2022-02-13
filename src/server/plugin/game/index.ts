import {AlertManager} from '@/core/alert';
import {
  BaseHero,
  BaseEnemy,
  KillEvent,
  Projectile,
  Unit,
  WorldManager,
  Team,
  Tank,
} from '@/core/entity';
import {EventManager} from '@/core/event';
import {StateMachine} from '@/core/fsm';
import {Vector} from '@/core/geometry';
import {COLORS, randomColor} from '@/core/graphics';
import {Iterator} from '@/core/iterator';
import {PlayerJoinEvent, PlayerManager} from '@/core/player';
import {RNGManager} from '@/core/random';
import {HeroModifier} from '@/core/upgrade';
import {ChatManager} from '@/server/chat';
import {Server} from '@/server/net';
import {FsmPlugin} from '@/server/plugin';

export enum GameState {
  Starting,
  Running,
  Stopping,
}

export enum GameAction {
  Start,
  Stop,
}

interface EnemyEntry {
  cost: number;
  minWave: number;
}

const ENEMY_COSTS: Record<string, EnemyEntry> = {
  Enemy: {
    cost: 10,
    minWave: 2,
  },
  HeavyEnemy: {
    cost: 20,
    minWave: 8,
  },
  HomingEnemy: {
    cost: 15,
    minWave: 5,
  },
  SwarmEnemy: {
    cost: 25,
    minWave: 15,
  },
  DefenderEnemy: {
    cost: 20,
    minWave: 15,
  },
  SmallEnemy: {
    cost: 5,
    minWave: 0,
  },
};

const ENEMY_TYPES = Object.keys(ENEMY_COSTS);

const MIN_BUDGET = Iterator.values(ENEMY_COSTS)
  .map((entry) => entry.cost)
  .fold(Number.POSITIVE_INFINITY, Math.min);

export type GameStateMachine = StateMachine<GameState, GameAction>;

export class GamePlugin extends FsmPlugin<GameState, GameAction> {
  public static typeName: string = 'GamePlugin';

  private wave: number = 0;
  private globalModifier: HeroModifier = new HeroModifier({
    damage: -0.5,
    rate: -0.5,
  });
  private isWaiting: boolean = false;
  private isPaused: boolean = false;

  private getWaveBudget(): number {
    return this.wave * 2 + 10;
  }

  public buildWave(budget: number): string[] {
    const wave = [];
    const sample = RNGManager.sample(ENEMY_TYPES, true)
      .map((type) => [type, ENEMY_COSTS[type] ?? MIN_BUDGET] as const)
      .takeWhile(() => budget >= MIN_BUDGET);
    for (const [type, {cost, minWave}] of sample) {
      if (minWave <= this.wave && cost <= budget) {
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

  private getEnemySpawnPoints(): Iterator<Vector> {
    const {x, y, farX, farY} = WorldManager.boundingBox;
    const points = RNGManager.vectors(x, y, farX, farY);
    return (
      points
        // Set an upper limit to avoid possible infinite loop
        .take(100)
        .filter((pt) => {
          // Disqualify a point if it is within a certain radius of any hero
          const doesOverlap = PlayerManager.getPlayers()
            .filterMap((player) => player.hero)
            .some((hero) => pt.distanceTo(hero.position) <= 200);
          return !doesOverlap;
        })
    );
  }

  private spawnEnemy(type: string, team: Team) {
    // Create enemy
    const position = this.getEnemySpawnPoints().first();
    if (!position) {
      // Fail to spawn if there are no valid positions
      // Could this be used as an exploit? Possibly
      return;
    }
    const enemy = WorldManager.spawnEntity(type);

    if (!(enemy instanceof Tank)) {
      return;
    }

    enemy.composeModifiers(this.globalModifier);

    enemy.setPosition(position);

    if (team !== undefined) {
      enemy.setTeam(team);
    } else {
      // Pick color
      enemy.setColor(randomColor());
    }
  }

  private getTeamUnits(team: Team): Iterator<Unit> {
    return WorldManager.getEntities()
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .filter((unit) => unit.team === team && unit.getXPWorth() > 0);
  }

  private getTeamCount(team: Team): number {
    return this.getTeamUnits(team).count();
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

      if (this.getTeamCount(Team.Blue) === 0) {
        this.transition(GameAction.Stop);
      }
    });

    // Spawn enemy units
    this.takeDuringState(GameState.Running, this.streamInterval(1))
      .filter(() => !(this.isWaiting || this.isPaused))
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

    // Distribute experience evenly among all players
    this.takeDuringState(
      GameState.Running,
      this.streamEvents<KillEvent>('KillEvent')
    )
      .map((event) => {
        const {targetID, sourceID} = event.data;
        const target = WorldManager.getEntity(targetID);
        const source = WorldManager.getEntity(sourceID);
        return {target, source};
      })
      .filterMap(({target, source}) =>
        target instanceof Unit && source instanceof Unit
          ? {target, source}
          : undefined
      )
      .filter(({source}) => source.team === Team.Blue)
      .forEach(({target}) => {
        const heroes = this.getTeamUnits(Team.Blue)
          .filterMap((unit) => (unit instanceof BaseHero ? unit : undefined))
          .toArray();
        const xp = target.getXPWorth() / heroes.length;
        for (const hero of heroes) {
          hero.addExperience(xp);
        }
      });

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
      name: 'pause',
      help: 'Pause the game',
      permissionLevel: 1,
      handler: (player) => {
        const isPaused = !this.isPaused;
        this.isPaused = isPaused;
        const status = isPaused ? 'paused' : 'unpaused';
        const message = `${player.name} has ${status} the game`;
        AlertManager.send(message);
      },
    });

    this.registerCommand({
      name: 'level',
      help: 'Level up',
      permissionLevel: 1,
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
      permissionLevel: 1,
      handler: stopHandler,
    });

    this.registerCommand({
      name: 'spawnColors',
      help: 'Spawns tanks with the current color palette',
      permissionLevel: 1,
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
          tank.setName(`${1 + i}`);
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
      permissionLevel: 1,
      handler: startHandler,
    });

    this.registerCommand({
      name: 'force',
      help: 'Applies a force to your character',
      permissionLevel: 1,
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

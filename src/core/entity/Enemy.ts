import {WorldManager, Unit, Tank, KillEvent} from 'core/entity';
import {clamp} from 'core/util';
import {MovementDirection} from 'core/input';
import {NetworkManager} from 'core/net';
import {LogManager} from 'core/log';
import {RNGManager} from 'core/random';

const log = LogManager.forFile(__filename);

export class Enemy extends Tank {
  public static typeName: string = 'Enemy';

  private target?: Unit;

  public constructor() {
    super();
    this.type = Enemy.typeName;
    this.setName('Tank');

    this.setWeapon('Gun');
    this.selectTarget();

    this.streamEvents<KillEvent>('KillEvent')
      .filter(
        (event) => this.target === WorldManager.getEntity(event.data.targetID)
      )
      .forEach(() => this.selectTarget());

    if (this.label) {
      this.label.tag = ' [AI]';
    }

    this.setMaxLife(40);
    this.setXPWorth(10);
  }

  public damage(amount: number, source?: Unit): void {
    super.damage(amount, source);
    if (source) {
      this.target = source;
    }
  }

  private selectTarget(): void {
    // Select the closest unit
    const [target] = WorldManager.getEntities()
      .filter((entity) => this !== entity)
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .map<[Unit | undefined, number]>((entity) => [
        entity,
        entity.position.distanceTo(this.position),
      ])
      .fold(
        [<Unit | undefined>undefined, Number.POSITIVE_INFINITY],
        (min, cur) => {
          if (cur[1] < min[1]) {
            return cur;
          } else {
            return min;
          }
        }
      );
    if (target) {
      log.trace('select target ' + target.toString());
      this.target = target;
    }
  }

  public step(dt: number): void {
    super.step(dt);

    if (NetworkManager.isServer()) {
      if (RNGManager.nextBoolean(clamp(0.1 * dt, 0, 1))) {
        this.selectTarget();
      }

      // Reset movement
      this.setMovement(MovementDirection.Up, false);
      this.setMovement(MovementDirection.Down, false);
      this.setMovement(MovementDirection.Left, false);
      this.setMovement(MovementDirection.Right, false);

      const {target} = this;
      if (target && target.isAlive) {
        if (target.position.distanceTo(this.position) > 150) {
          // Calculate movement to reach target
          const dx = this.position.x - target.position.x;
          const dy = this.position.y - target.position.y;

          if (dy > 10) {
            this.setMovement(MovementDirection.Up, true);
          } else if (dy < -10) {
            this.setMovement(MovementDirection.Down, true);
          }

          if (dx > 10) {
            this.setMovement(MovementDirection.Left, true);
          } else if (dx < -10) {
            this.setMovement(MovementDirection.Right, true);
          }
        }

        // Point cannon at target
        const angle = this.position.angleTo(target.position);
        this.angle = angle;
        this.fire(this.angle);
      }
    }
  }
}

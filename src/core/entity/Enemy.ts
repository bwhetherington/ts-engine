import { Tank } from './Tank';
import { Unit } from './Unit';
import { WorldManager, Entity } from '.';
import { clamp } from 'core/util';
import { MovementDirection } from 'core/input';
import { NetworkManager } from 'core/net';
import { LogManager } from 'core/log';
import { KillEvent } from './util';

const log = LogManager.forFile(__filename);

export class Enemy extends Tank {
  public static typeName: string = 'Enemy';

  private target?: Unit;

  public constructor() {
    super();
    this.type = Enemy.typeName;
    this.selectTarget();

    this.addListener<KillEvent>('KillEvent', (event) => {
      if (this.target === event.data.target) {
        this.selectTarget();
      }
    });

    if (this.label) {
      this.label.tag = 'AI';
    }
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
      .filterType((entity): entity is Unit => entity instanceof Unit)
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
      log.debug('select target ' + target.toString());
      this.target = target;
    }
  }

  public step(dt: number): void {
    super.step(dt);

    if (NetworkManager.isServer()) {
      if (Math.random() < clamp(0.1 * dt, 0, 1)) {
        this.selectTarget();
      }

      // Reset movement
      this.setMovement(MovementDirection.Up, false);
      this.setMovement(MovementDirection.Down, false);
      this.setMovement(MovementDirection.Left, false);
      this.setMovement(MovementDirection.Right, false);

      const { target } = this;
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

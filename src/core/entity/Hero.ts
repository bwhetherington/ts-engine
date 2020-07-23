import { Unit } from 'core/entity';
import {
  MovementDirection,
  KeyEvent,
  KeyAction,
  MOVEMENT_DIRECTION_MAP,
} from 'core/input';
import { StepEvent } from 'core/event';
import { Vector } from 'core/geometry';
import { Data } from 'core/serialize';
import { Player, PM } from 'core/player';
import { LM as InternalLogger } from 'core/log';
import { NM, SyncEvent } from 'core/net';
import { CM } from 'core/graphics';

const LM = InternalLogger.forFile(__filename);

const ACCELERATION = 2000;
const MAX_SPEED = 250;

export class Hero extends Unit {
  public static typeName: string = 'Hero';

  private input = {
    [MovementDirection.Up]: false,
    [MovementDirection.Down]: false,
    [MovementDirection.Left]: false,
    [MovementDirection.Right]: false,
  };
  private acceleration: Vector = new Vector(0, 0);
  private player?: Player;

  public constructor() {
    super();

    this.type = Hero.typeName;
    this.boundingBox.width = 30;
    this.boundingBox.height = 30;
    this.friction = 1000;
    this.bounce = 0.1;

    this.addListener<KeyEvent>('KeyEvent', (event) => {
      const { data, socket } = event;

      // Check if there is either no socket specified (local event)
      // or if the soket matches this Hero's player's socket
      const checkLocal = socket === undefined && this.getPlayer()?.isActivePlayer();

      if (checkLocal || socket === this.getPlayer()?.socket) {
        const { action, key } = data;
        const state = action === KeyAction.KeyDown;
        const direction = MOVEMENT_DIRECTION_MAP[key];
        if (direction !== undefined) {
          this.setMovement(direction, state);
        }
      }
    });
  }

  public setPlayer(player: string | Player): void {
    if (typeof player === 'string') {
      this.player = PM.getPlayer(player);
    } else {
      this.player = player;
    }
  }

  public getPlayer(): Player | undefined {
    return this.player;
  }

  public setMovement(direction: MovementDirection, state: boolean): void {
    this.input[direction] = state;
  }

  public step(dt: number): void {
    this.acceleration.setXY(0, 0);

    if (this.input[MovementDirection.Up]) {
      this.acceleration.addXY(0, -1);
    }

    if (this.input[MovementDirection.Down]) {
      this.acceleration.addXY(0, 1);
    }

    if (this.input[MovementDirection.Left]) {
      this.acceleration.addXY(-1, 0);
    }

    if (this.input[MovementDirection.Right]) {
      this.acceleration.addXY(1, 0);
    }

    this.acceleration.magnitude = ACCELERATION * dt;
    this.applyForce(this.acceleration);

    if (this.velocity.magnitude > MAX_SPEED) {
      const excess = this.velocity.magnitude - MAX_SPEED;
      this.frictionBuffer.set(this.velocity);
      this.frictionBuffer.normalize();
      this.frictionBuffer.scale(-excess);
      this.velocity.add(this.frictionBuffer);
    }

    super.step(dt);

    if (this.getPlayer()?.isActivePlayer()) {
      CM.setTargetXY(this.boundingBox.centerX, this.boundingBox.centerY);
    }
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      input: this.input,
      playerID: this.player?.id,
    };
  }

  public deserialize(data: Data): void {
    const { x: oldX, y: oldY } = this.position;
    const { x: oldDX, y: oldDY } = this.velocity;

    super.deserialize(data);
    const { input, playerID } = data;

    if (playerID !== undefined) {
      this.setPlayer(playerID);
      const player = this.getPlayer();
      if (player && player.hero !== this) {
        player.setHero(this);
      }
    }

    if (input) {
      if (MovementDirection.Up in input) {
        this.setMovement(MovementDirection.Up, input[MovementDirection.Up]);
      }

      if (MovementDirection.Down in input) {
        this.setMovement(MovementDirection.Down, input[MovementDirection.Down]);
      }

      if (MovementDirection.Left in input) {
        this.setMovement(MovementDirection.Left, input[MovementDirection.Left]);
      }

      if (MovementDirection.Right in input) {
        this.setMovement(
          MovementDirection.Right,
          input[MovementDirection.Right]
        );
      }
    }

    if (this.getPlayer()?.isActivePlayer()) {
      // Use our own position
      this.setPositionXY(oldX, oldY);
      this.velocity.setXY(oldDX, oldDY);
      const syncEvent = {
        type: 'SyncEvent',
        data: <SyncEvent>{
          worldData: {
            entities: {
              [this.id]: {
                position: this.position.serialize(),
                velocity: this.velocity.serialize(),
              },
            },
          },
          playerData: {}
        }
      };
      NM.send(syncEvent);
    }
  }
}

import { Unit, WM } from 'core/entity';
import {
  MovementDirection,
  KeyEvent,
  KeyAction,
  MOVEMENT_DIRECTION_MAP,
  MouseEvent,
  MouseAction,
} from 'core/input';
import { EventData, Event, EM } from 'core/event';
import { Vector } from 'core/geometry';
import { Data } from 'core/serialize';
import { Player, PM } from 'core/player';
import { LM as InternalLogger } from 'core/log';
import { NM, SyncEvent } from 'core/net';
import { CM, GraphicsContext } from 'core/graphics';
import { Projectile } from './Projectile';
import { UIM } from 'client/components';
import { BarUpdateEvent } from 'core/util';

const LM = InternalLogger.forFile(__filename);

export class Hero extends Unit {
  public static typeName: string = 'Hero';

  private angle: number = 0;
  private player?: Player;

  public constructor() {
    super();

    this.type = Hero.typeName;
    this.boundingBox.width = 30;
    this.boundingBox.height = 30;
    this.friction = 1000;
    this.bounce = 0.1;

    this.setMaxLife(100);
    this.setLife(100);

    this.addListener<MouseEvent>('MouseEvent', (event) => {
      if (this.isEventSubject(event)) {
        const { action, x, y } = event.data;
        if (action === MouseAction.Move) {
          // Subtract our position from mouse position
          this.vectorBuffer.setXY(x, y);
          this.vectorBuffer.add(this.position, -1);
          this.angle = this.vectorBuffer.angle;
        } else if (action === MouseAction.ButtonUp) {
          // Shoot projectile if we are on the server
          if (NM.isServer()) {
            LM.info('fire');
            const projectile = new Projectile();
            projectile.position.set(this.position);
            projectile.velocity.setXY(x, y);
            projectile.velocity.add(this.position, -1);
            projectile.velocity.normalize();
            projectile.position.add(projectile.velocity, 20);
            projectile.velocity.scale(500);
            WM.add(projectile);
          }
        }
      }
    });

    this.addListener<KeyEvent>('KeyEvent', (event) => {
      if (this.isEventSubject(event)) {
        const { action, key } = event.data;
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

  public setMaxLife(maxLife: number): void {
    super.setMaxLife(maxLife);
    if (this.getPlayer()?.isActivePlayer()) {
      EM.emit({
        type: 'BarUpdateEvent',
        data: <BarUpdateEvent>{
          id: 'life-bar',
          value: this.getLife(),
          maxValue: this.getMaxLife(),
        },
      });
    }
  }

  public setLife(life: number): void {
    super.setLife(life);
    if (this.getPlayer()?.isActivePlayer()) {
      EM.emit({
        type: 'BarUpdateEvent',
        data: <BarUpdateEvent>{
          id: 'life-bar',
          value: this.getLife(),
          maxValue: this.getMaxLife(),
        },
      });
    }
  }

  public step(dt: number): void {
    super.step(dt);
    if (this.getPlayer()?.isActivePlayer()) {
      CM.setTargetXY(this.boundingBox.centerX, this.boundingBox.centerY);
    }
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      playerID: this.player?.id,
      angle: this.angle,
    };
  }

  public deserialize(data: Data): void {
    const { x: oldX, y: oldY } = this.position;
    const { x: oldDX, y: oldDY } = this.velocity;

    super.deserialize(data);
    const { playerID, angle } = data;

    if (playerID !== undefined) {
      this.setPlayer(playerID);
      const player = this.getPlayer();
      if (player && player.hero !== this) {
        player.setHero(this);
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
          playerData: {},
        },
      };
      NM.send(syncEvent);
    } else {
      // If we are not the active player, we should use the deserialized angle
      if (typeof angle === 'number') {
        this.angle = angle;
      }
    }
  }

  public render(ctx: GraphicsContext): void {
    super.render(ctx);
    const { centerX, centerY } = this.boundingBox;

    // Draw turret
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);

    ctx.rect(-5, -5, 25, 10, this.color);

    ctx.rotate(-this.angle);
    ctx.translate(-centerX, -centerY);
  }

  private isEventSubject<E extends EventData>(event: Event<E>): boolean {
    const { socket } = event;
    const player = this.getPlayer();
    const isLocal = socket === undefined && player?.isActivePlayer();
    return isLocal || socket === player?.socket;
  }
}

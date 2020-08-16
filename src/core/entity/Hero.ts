import {
  Text,
  WorldManager,
  DamageEvent,
  Tank,
  KillEvent,
  Unit,
} from 'core/entity';
import {
  KeyEvent,
  KeyAction,
  MOVEMENT_DIRECTION_MAP,
  MouseEvent,
  MouseAction,
} from 'core/input';
import { EventData, Event, EventManager } from 'core/event';
import { Data } from 'core/serialize';
import { Player, PlayerManager } from 'core/player';
import { LogManager } from 'core/log';
import { NetworkManager, SyncEvent } from 'core/net';
import { CameraManager, rgb } from 'core/graphics';
import { BarUpdateEvent, sleep } from 'core/util';

const log = LogManager.forFile(__filename);

function experienceForLevel(level: number): number {
  if (level < 1) {
    return 0;
  }
  return 3 + Math.ceil(level * level * 3);
}

function lifeForLevel(level: number): number {
  return 5 + level * 5;
}

function armorForLevel(level: number): number {
  return Math.floor(level / 2);
}

// 5 10 25 

export class Hero extends Tank {
  public static typeName: string = 'Hero';

  private player?: Player;
  private mouseDown: boolean = false;

  private xp: number = 0;
  private level: number = 0;

  public constructor() {
    super();

    this.type = Hero.typeName;

    this.setExperience(0);
    this.setLevel(1);

    this.addListener<MouseEvent>('MouseEvent', (event) => {
      if (this.isEventSubject(event)) {
        const { action, x, y } = event.data;
        if (action === MouseAction.Move) {
          // Subtract our position from mouse position
          this.vectorBuffer.setXY(x, y);
          this.vectorBuffer.add(this.position, -1);
          this.angle = this.vectorBuffer.angle;
        } else if (action === MouseAction.ButtonDown) {
          this.mouseDown = true;
        } else if (action === MouseAction.ButtonUp) {
          this.mouseDown = false;
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

    if (NetworkManager.isClient()) {
      this.addListener<DamageEvent>('DamageEvent', async (event) => {
        const { target, source, amount } = event.data;
        if (
          this.getPlayer()?.isActivePlayer() &&
          (this === target || this === source)
        ) {
          const label = '' + amount;
          const text = WorldManager.spawn(Text, target.position);
          text.color = rgb(192, 128, 128);
          text.isStatic = false;
          text.position.addXY(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
          );
          text.text = label;
          text.tag = 'dmg';
          text.velocity.setXY(25 + Math.random() * 25, 0);
          text.velocity.angle = Math.random() * 2 * Math.PI;
          await sleep(1);
          text.markForDelete();
        }
      });
    } else {
      this.addListener<KillEvent>('KillEvent', (event) => {
        const { source } = event.data;
        if (this === source) {
          this.setExperience(this.xp + 5);
        }
      });
    }
  }

  public setExperience(amount: number): void {
    this.xp = amount;
    while (this.xp >= experienceForLevel(this.level)) {
      this.setLevel(this.level + 1);
    }

    if (this.getPlayer()?.isActivePlayer()) {
      const prevXp = experienceForLevel(this.level - 1);
      EventManager.emit({
        type: 'BarUpdateEvent',
        data: <BarUpdateEvent>{
          id: 'xp-bar',
          value: (this.xp - prevXp),
          maxValue: experienceForLevel(this.level) - prevXp,
        },
      });
    }
  }

  private setLevel(level: number): void {
    if (level !== this.level) {
      this.level = level;
      this.setMaxLife(lifeForLevel(level));
      this.setLife(this.getMaxLife());
      this.armor = armorForLevel(level);
    }
  }

  public setPlayer(player: string | Player): void {
    if (typeof player === 'string') {
      this.player = PlayerManager.getPlayer(player);
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
      EventManager.emit({
        type: 'BarUpdateEvent',
        data: <BarUpdateEvent>{
          id: 'life-bar',
          value: this.getLife(),
          maxValue: this.getMaxLife(),
        },
      });
    }
  }

  public setLife(life: number, source?: Unit): void {
    super.setLife(life, source);
    if (this.getPlayer()?.isActivePlayer()) {
      EventManager.emit({
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
      CameraManager.setTargetXY(
        this.boundingBox.centerX,
        this.boundingBox.centerY
      );
    }

    if (this.mouseDown && NetworkManager.isServer()) {
      this.fire(this.angle);
    }

    if (this.label) {
      const player = this.getPlayer();
      if (player) {
        this.label.text = player.name;
        this.label.tag = '' + this.level;
      }
    }
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      playerID: this.player?.id,
      xp: this.xp,
    };
  }

  public deserialize(data: Data): void {
    const { x: oldX, y: oldY } = this.position;
    const { angle: oldAngle } = this;

    super.deserialize(data);
    const { playerID, xp } = data;

    if (playerID !== undefined) {
      this.setPlayer(playerID);
      const player = this.getPlayer();
      if (player && player.hero !== this) {
        player.setHero(this);
      }
    }

    if (typeof xp === 'number') {
      this.setExperience(xp);
    }

    if (this.getPlayer()?.isActivePlayer()) {
      // Use our angle
      this.angle = oldAngle;

      // Use our own position
      this.setPositionXY(oldX, oldY);
      const syncEvent = {
        type: 'SyncEvent',
        data: <SyncEvent>{
          worldData: {
            entities: {
              [this.id]: {
                position: this.position.serialize(),
              },
            },
          },
          playerData: {},
        },
      };
      NetworkManager.send(syncEvent);
    }
  }

  private isEventSubject<E extends EventData>(event: Event<E>): boolean {
    const { socket } = event;
    const player = this.getPlayer();
    const isLocal = socket === undefined && player?.isActivePlayer();
    return isLocal || socket === player?.socket;
  }
}

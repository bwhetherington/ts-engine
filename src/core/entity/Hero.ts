import {
  WorldManager,
  DamageEvent,
  Tank,
  KillEvent,
  Unit,
  TimedText,
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
import { CameraManager, rgb, GraphicsContext } from 'core/graphics';
import { BarUpdateEvent, sleep } from 'core/util';

const log = LogManager.forFile(__filename);

// 5 10 25

export class Hero extends Tank {
  public static typeName: string = 'Hero';

  private player?: Player;
  private mouseDown: boolean = false;

  private xp: number = 0;
  private level: number = 0;
  private isInitialized: boolean = false;

  public constructor() {
    super();

    this.type = Hero.typeName;

    this.setWeapon('MachineGun');

    this.setExperience(0);
    this.setLevelInternal(1);

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
          amount > 0 &&
          this.getPlayer()?.isActivePlayer() &&
          (this === target || this === source)
        ) {
          const label = '' + amount;
          const text = WorldManager.spawn(TimedText, target.position);
          const color = this === target ? rgb(1, 0.4, 0.4) : rgb(1, 1, 0.2);
          text.setColor(color);
          text.isStatic = false;
          text.position.addXY(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
          );
          text.text = label;
          text.velocity.setXY(25 + Math.random() * 25, 0);
          text.velocity.angle = Math.random() * 2 * Math.PI;
        }
      });
    } else {
      this.addListener<KillEvent>('KillEvent', (event) => {
        const { source, target } = event.data;
        if (this === source) {
          this.addExperience(target.getXPWorth());
        }
      });
    }
  }

  public getXPWorth(): number {
    return Math.max(1, this.getExperience() / 2);
  }

  protected experienceForLevel(level: number): number {
    if (level < 1) {
      return 0;
    }
    return 3 + Math.ceil(level * level * 3);
  }

  protected lifeForLevel(level: number): number {
    return 5 + level * 5;
  }

  protected regenForLevel(level: number): number {
    return this.lifeForLevel(level) / 30;
  }

  protected armorForLevel(level: number): number {
    return Math.floor(level / 4);
  }

  public getExperience(): number {
    return this.xp;
  }

  public addExperience(amount: number): void {
    this.setExperience(this.getExperience() + amount);
  }

  public setExperience(amount: number): void {
    this.xp = amount;

    while (this.xp >= this.experienceForLevel(this.level)) {
      this.setLevelInternal(this.level + 1);
    }

    while (this.xp < this.experienceForLevel(this.level - 1)) {
      this.setLevelInternal(this.level - 1);
    }

    if (this.getPlayer()?.isActivePlayer()) {
      const prevXp = this.experienceForLevel(this.level - 1);
      EventManager.emit({
        type: 'BarUpdateEvent',
        data: <BarUpdateEvent>{
          id: 'xp-bar',
          value: this.xp - prevXp,
          maxValue: this.experienceForLevel(this.level) - prevXp,
        },
      });
    }
  }

  public setLevel(level: number): void {
    this.setLevelInternal(level);
    this.setExperience(this.experienceForLevel(level - 1));
  }

  private setLevelInternal(level: number): void {
    if (level !== this.level) {
      this.level = level;
      this.setMaxLife(this.lifeForLevel(level));
      this.armor = this.armorForLevel(level);
      this.lifeRegen = this.regenForLevel(level);
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

    const player = this.getPlayer();
    if (player) {
      if (player.isActivePlayer()) {
        CameraManager.setTargetXY(
          this.boundingBox.centerX,
          this.boundingBox.centerY
        );
      }

      if (this.label) {
        this.label.text = player.name;
        this.label.tag = 'Level ' + this.level;
      }
    }

    if (this.mouseDown && NetworkManager.isServer()) {
      this.fire(this.angle);
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

    if (this.getPlayer()?.isActivePlayer() && this.isInitialized) {
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

    this.isInitialized = true;
  }

  public isEventSubject<E extends EventData>(event: Event<E>): boolean {
    const { socket } = event;
    const player = this.getPlayer();
    const isLocal = socket === undefined && player?.isActivePlayer();
    return isLocal || socket === player?.socket;
  }

  public render(ctx: GraphicsContext): void {
    super.render(ctx);
  }
}

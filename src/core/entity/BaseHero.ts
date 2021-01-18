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
import {EventData, Event, EventManager} from 'core/event';
import {Data} from 'core/serialize';
import {Player, PlayerManager} from 'core/player';
import {LogManager} from 'core/log';
import {NetworkManager, SyncEvent} from 'core/net';
import {CameraManager, rgb, GraphicsContext, hsv} from 'core/graphics';
import {BarUpdateEvent, clamp, sleep} from 'core/util';
import {RNGManager} from 'core/random';
import {TextColor} from 'core/chat';
import {Matrix2} from 'core/geometry';
import {UUID} from 'core/uuid';

const log = LogManager.forFile(__filename);

export class BaseHero extends Tank {
  public static typeName: string = 'BaseHero';

  private player?: Player;
  private mouseDown: boolean = false;

  private xp: number = 0;
  private level: number = 0;

  private maxHPTransform: Matrix2 = new Matrix2().identity();

  public constructor() {
    super();

    this.type = BaseHero.typeName;

    this.setWeapon('Gun');

    this.setExperience(0);
    this.setLevelInternal(1);

    this.addListener<MouseEvent>('MouseEvent', (event) => {
      if (this.isEventSubject(event)) {
        const {action, x, y} = event.data;
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
        const {action, key} = event.data;
        const state = action === KeyAction.KeyDown;
        const direction = MOVEMENT_DIRECTION_MAP[key];
        if (direction !== undefined) {
          this.setMovement(direction, state);
        }
      }
    });

    if (NetworkManager.isClient()) {
      this.addListener<DamageEvent>('DamageEvent', async (event) => {
        const {targetID, sourceID, amount} = event.data;
        const target = WorldManager.getEntity(targetID);
        const source = WorldManager.getEntity(sourceID);
        if (
          target &&
          amount > 0 &&
          this.getPlayer()?.isActivePlayer() &&
          (this === target || this === source)
        ) {
          const label = Math.round(amount).toLocaleString();
          const text = WorldManager.spawn(TimedText, target.position);
          const color = this === target ? 'red' : 'yellow';
          text.textColor = color;
          text.isStatic = false;
          text.position.addXY(
            RNGManager.nextFloat(-25, 25),
            RNGManager.nextFloat(-25, 25)
          );
          text.text = label;
          text.velocity.setXY(0, -60);
          text.velocity.angle += RNGManager.nextFloat(-0.3, 0.3);
          text.friction = 50;
          text.textSize = 20;
        }
      });
    } else {
      this.streamEvents<KillEvent>('KillEvent')
        .map((event) => {
          const {targetID, sourceID} = event.data;
          const target = WorldManager.getEntity(targetID);
          const source = WorldManager.getEntity(sourceID);
          return {target, source};
        })
        .filterMap(({target, source}) =>
          target instanceof Unit && this === source ? target : undefined
        )
        .forEach((target) => this.addExperience(target.getXPWorth()));
    }
  }

  protected getNameColor(): TextColor {
    return this.getPlayer()?.getNameColor() ?? super.getNameColor();
  }

  public getXPWorth(): number {
    return Math.max(1, this.getExperience() / 2);
  }

  protected damageBonusForLevel(level: number): number {
    return 1 + level / 20;
  }

  protected experienceForLevel(level: number): number {
    if (level < 1) {
      return 0;
    }
    return 3 + Math.ceil(level * level * 3);
  }

  protected lifeForLevel(level: number): number {
    return this.maxHPTransform.multiplyPoint(50 + (level - 1) * 5);
  }

  protected regenForLevel(level: number): number {
    return this.lifeForLevel(level) / 30;
  }

  protected armorForLevel(level: number): number {
    return Math.floor(level / 6);
  }

  public getExperience(): number {
    return this.xp;
  }

  public addExperience(amount: number): void {
    this.setExperience(this.getExperience() + amount);
  }

  public setExperience(amount: number): void {
    this.xp = amount;

    while (this.xp >= this.experienceForLevel(this.level) && this.level < 40) {
      this.setLevelInternal(this.level + 1);
    }

    while (
      this.xp < this.experienceForLevel(this.level - 1) &&
      this.level > 1
    ) {
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

  public getLevel(): number {
    return this.level;
  }

  private setLevelInternal(level: number): void {
    level = clamp(level, 1, 40);
    if (level !== this.level) {
      this.level = level;
      this.setMaxLife(this.lifeForLevel(level));
      this.armor = this.armorForLevel(level);
      this.lifeRegen = this.regenForLevel(level);
    }
  }

  public setPlayer(player: UUID | Player): void {
    if (typeof player === 'number') {
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

  public getName(): string {
    return this.getPlayer()?.name ?? super.getName();
  }

  public step(dt: number): void {
    super.step(dt);

    const player = this.getPlayer();
    if (player) {
      if (player.isActivePlayer()) {
        const {centerX: x, centerY: y} = this.boundingBox;
        CameraManager.setTargetXY(x, y);
      }

      if (this.label) {
        this.label.tag = ` [${this.level}]`;
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
      maxHPTransform: this.maxHPTransform.serialize(),
    };
  }

  public deserialize(data: Data): void {
    const {x: oldX, y: oldY} = this.position;
    const {angle: oldAngle} = this;
    const {playerID, xp, maxHPTransform} = data;

    if (playerID !== undefined) {
      this.setPlayer(playerID);
      const player = this.getPlayer();
      if (player && player.hero !== this) {
        player.setHero(this);
      }
    }

    if (maxHPTransform) {
      this.maxHPTransform.deserialize(maxHPTransform);
    }

    if (typeof xp === 'number') {
      this.setExperience(xp);
    }

    super.deserialize(data);

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
  }

  public isEventSubject<E extends EventData>(event: Event<E>): boolean {
    const {socket} = event;
    const player = this.getPlayer();
    const isLocal = socket === undefined && player?.isActivePlayer();
    return isLocal || socket === player?.socket;
  }

  protected calculateDamageOut(amount: number): number {
    return amount * this.damageBonusForLevel(this.getLevel());
  }
}

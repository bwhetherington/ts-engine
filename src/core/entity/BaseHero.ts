import {TextColor} from '@/core/chat';
import {
  DamageEvent,
  Entity,
  Tank,
  Text,
  TimedText,
  Unit,
  WorldManager,
} from '@/core/entity';
import {
  Event,
  EventData,
  EventManager,
  Priority,
  makeEventType,
} from '@/core/event';
import {Vector} from '@/core/geometry';
import {CameraManager} from '@/core/graphics';
import {
  Key,
  KeyAction,
  KeyEvent,
  MouseAction,
  MouseButton,
  MouseEvent,
  MovementDirection,
} from '@/core/input';
import {Iterator} from '@/core/iterator';
import {NetworkManager} from '@/core/net';
import {Player, PlayerManager} from '@/core/player';
import {RNGManager} from '@/core/random';
import {Data} from '@/core/serialize';
import {
  ChangeStoredUpgradeCountEvent,
  Upgrade,
  UpgradeEvent,
  UpgradeManager,
} from '@/core/upgrade';
import {BarUpdateEvent} from '@/core/util';
import {UUID, isUUID} from '@/core/uuid';

export interface LevelUpEvent {
  id: UUID;
  from: number;
  to: number;
}
export const LevelUpEvent = makeEventType<LevelUpEvent>('LevelUpEvent');

export interface SyncHeroEvent {
  hero: Data;
}
export const SyncHeroEvent = makeEventType<SyncHeroEvent>('SyncHeroEvent');

export class BaseHero extends Tank {
  public static typeName: string = 'BaseHero';

  private player?: Player;
  private mouseDown: boolean = false;
  private turning: Record<MovementDirection, boolean> = {
    [MovementDirection.Up]: false,
    [MovementDirection.Down]: false,
    [MovementDirection.Left]: false,
    [MovementDirection.Right]: false,
  };
  public upgrades: string[] = [];
  public classTier: number = 0;

  private _storedUpgrades: number = 0;

  private xp: number = 0;
  private level: number = 1;
  private cameraTarget?: Entity;

  public replacementId?: UUID;
  private hasReplaced: boolean = false;

  public get storedUpgrades(): number {
    return this._storedUpgrades;
  }

  public set storedUpgrades(val) {
    if (val !== this._storedUpgrades && this.getPlayer()?.isActivePlayer()) {
      EventManager.emitEvent(ChangeStoredUpgradeCountEvent, {
        storedUpgrades: val,
      });
    }
    this._storedUpgrades = val;
  }

  public constructor() {
    super();

    this.type = BaseHero.typeName;

    this.setMaxLife(200);
    this.setLife(200);

    this.setWeapon('Gun');
    this.setLevelInternal(1);
    this.setExperience(0);

    this.streamEvents(MouseEvent, Priority.Normal, true)
      .filter((event) => this.isEventSubject(event))
      .forEach(({data: {action, x, y, button}}) => {
        if (action === MouseAction.Move) {
          // Subtract our position from mouse position
          Vector.BUFFER.setXY(x, y);
          Vector.BUFFER.add(this.position, -1);
          this.weaponAngle = Vector.BUFFER.angle;
          // this.targetAngle = Vector.BUFFER.angle;
        }
        if (action === MouseAction.ButtonDown || MouseAction.ButtonUp) {
          const state = action === MouseAction.ButtonDown;
          switch (button) {
            case MouseButton.Left:
              this.mouseDown = state;
              break;
          }
        }
      });

    this.streamEvents(KeyEvent, Priority.Normal, true)
      .filter((event) => this.isEventSubject(event))
      .forEach(({data: {action, key}}) => {
        const state = action === KeyAction.KeyDown;
        switch (key) {
          case Key.W:
            this.turning[MovementDirection.Up] = state;
            break;
          case Key.S:
            this.turning[MovementDirection.Down] = state;
            break;
          case Key.A:
            this.turning[MovementDirection.Left] = state;
            break;
          case Key.D:
            this.turning[MovementDirection.Right] = state;
            break;
        }
      });

    if (NetworkManager.isClient()) {
      this.label = WorldManager.spawn(Text, this.position);

      this.streamEvents(DamageEvent)
        .map(({data: {targetID, sourceID, amount}}) => ({
          amount,
          target: WorldManager.getEntity(targetID),
          source: WorldManager.getEntity(sourceID),
        }))
        .filterMap(({amount, target, source}) =>
          !!target &&
          amount > 0 &&
          (this.getPlayer()?.isActivePlayer?.() ?? false) &&
          (this === target || this === source)
            ? {amount, target}
            : undefined
        )
        .forEach(({amount, target}) => {
          const label = Math.round(amount).toLocaleString();
          const text = WorldManager.spawn(TimedText, target.position);
          if (!text) {
            return;
          }
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
        });
    }
  }

  public static initializeType() {
    EventManager.streamEvents(SyncHeroEvent)
      // .debounce(1 / 30)
      .forEach((event) => {
        NetworkManager.sendEvent(event);
      });
  }

  public applyUpgrade(upgrade: Upgrade, isNew: boolean = true) {
    upgrade.applyTo(this);
    this.upgrades.push(upgrade.type);
    if (isNew) {
      EventManager.emitEvent(UpgradeEvent, {
        hero: this,
        upgrade,
      });
    }
  }

  public copyUpgrades(other: BaseHero) {
    Iterator.array(other.upgrades)
      .filterMap((type) => UpgradeManager.instantiate(type))
      .forEach((upgrade) => this.applyUpgrade(upgrade, false));
    this.upgrades = [...other.upgrades];
  }

  protected override getNameColor(): TextColor {
    return this.getPlayer()?.getNameColor() ?? super.getNameColor();
  }

  public override getXPWorth(): number {
    return Math.max(1, this.getExperience() / 2);
  }

  protected damageBonusForLevel(_level: number): number {
    return 0;
  }

  protected experienceForLevel(level: number): number {
    if (level < 1) {
      return 0;
    }
    return level * 20 + Math.ceil(level ** 2 * 3) + Math.ceil(level ** 3 / 15);
  }

  protected lifeForLevel(_level: number): number {
    return 200;
  }

  protected armorForLevel(_level: number): number {
    return 1;
  }

  public getExperience(): number {
    return this.xp;
  }

  public addExperience(amount: number) {
    this.setExperience(this.getExperience() + amount);
  }

  public setExperience(amount: number, allowLevels: boolean = true) {
    this.xp = amount;

    while (this.xp >= this.experienceForLevel(this.level)) {
      const oldLevel = this.level;
      this.setLevelInternal(this.level + 1);
      if (NetworkManager.isServer() && allowLevels) {
        EventManager.emitEvent(LevelUpEvent, {
          id: this.id,
          from: oldLevel,
          to: this.level,
        });
      }
    }

    while (
      this.xp < this.experienceForLevel(this.level - 1) &&
      this.level > 1
    ) {
      this.setLevelInternal(this.level - 1);
    }

    if (this.getPlayer()?.isActivePlayer()) {
      const prevXp = this.experienceForLevel(this.level - 1);
      EventManager.emitEvent(BarUpdateEvent, {
        id: 'xp-bar',
        value: this.xp - prevXp,
        maxValue: this.experienceForLevel(this.level) - prevXp,
      });
    }
  }

  public setLevel(level: number) {
    this.setLevelInternal(level);
    this.setExperience(this.experienceForLevel(level - 1));
  }

  public getLevel(): number {
    return this.level;
  }

  private setLevelInternal(level: number) {
    if (level !== this.level) {
      this.level = level;
    }
  }

  public setPlayer(player: UUID | Player) {
    const oldPlayer = this.player;
    let newPlayer;
    if (isUUID(player)) {
      newPlayer = PlayerManager.getPlayer(player);
    } else {
      newPlayer = player;
    }

    if (newPlayer !== oldPlayer) {
      this.player = newPlayer;
      if (this.player?.isActivePlayer()) {
        CameraManager.follow(this);
      }
    }
  }

  public getPlayer(): Player | undefined {
    return this.player;
  }

  public updateMaxLife() {
    this.setMaxLife(200);
  }

  public override setMaxLife(maxLife: number) {
    super.setMaxLife(maxLife);
    if (this.getPlayer()?.isActivePlayer?.()) {
      EventManager.emitEvent(BarUpdateEvent, {
        id: 'life-bar',
        value: this.getLife(),
        maxValue: this.getMaxLife(),
      });
    }
  }

  public override setLife(life: number, source?: Unit) {
    super.setLife(life, source);
    if (this.getPlayer()?.isActivePlayer?.()) {
      EventManager.emitEvent(BarUpdateEvent, {
        id: 'life-bar',
        value: this.getLife(),
        maxValue: this.getMaxLife(),
      });
    }
  }

  public override getName(): string {
    return this.getPlayer()?.name ?? super.getName();
  }

  public copyMovement(hero: BaseHero) {
    this.turning = {
      ...hero.turning,
    };
    this.computeMovementInput();
  }

  private computeMovementInput() {
    Vector.BUFFER.setXY(0, 0);
    if (this.turning[MovementDirection.Up]) {
      Vector.BUFFER.addXY(0, -1);
    }
    if (this.turning[MovementDirection.Down]) {
      Vector.BUFFER.addXY(0, 1);
    }
    if (this.turning[MovementDirection.Left]) {
      Vector.BUFFER.addXY(-1, 0);
    }
    if (this.turning[MovementDirection.Right]) {
      Vector.BUFFER.addXY(1, 0);
    }
    Vector.BUFFER.normalize();
    if (Vector.BUFFER.magnitudeSquared > 0) {
      this.setThrusting(1);
      this.targetAngle = Vector.BUFFER.angle % (2 * Math.PI);
    } else {
      this.setThrusting(0);
      this.targetAngle = this.angle;
    }
  }

  private updateExperience() {
    this.setExperience(this.getExperience());
  }

  public override step(dt: number) {
    this.computeMovementInput();
    super.step(dt);

    const player = this.getPlayer();
    if (player) {
      if (player.isActivePlayer() && this.cameraTarget) {
        const {x, y} = this.cameraTarget.position;
        CameraManager.setTargetXY(x, y);
      }

      // if (this.label) {
      //   this.label.tag = ` [${this.level}]`;
      // }
    }

    if (this.mouseDown && NetworkManager.isServer()) {
      this.fire(this.weaponAngle);
    }

    if (this.isInitialized) {
      delete this.replacementId;
    }
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      turning: this.turning,
      playerID: this.player?.id,
      replacementId: this.replacementId,
      xp: this.xp,
      storedUpgrades: this.storedUpgrades,
      classTier: this.classTier,
    };
  }

  public override deserialize(data: Data, setInitialized?: boolean) {
    const {x: oldX, y: oldY} = this.position;
    const {x: oldVX, y: oldVY} = this.velocity;
    const {
      angle: oldAngle,
      weaponAngle: oldWeaponAngle,
      targetAngle: oldTargetAngle,
    } = this;
    const {playerID, xp, storedUpgrades, classTier} = data;

    if (typeof classTier === 'number') {
      this.classTier = classTier;
    }

    if (typeof storedUpgrades === 'number') {
      this.storedUpgrades = storedUpgrades;
    }

    if (typeof xp === 'number') {
      this.setExperience(xp);
    }

    const wasInitialized = this.isInitialized;
    super.deserialize(data, setInitialized);

    if (!wasInitialized) {
      const {turning} = data;
      if (turning) {
        Iterator.keys(this.turning).forEach((key) => {
          const keyDirection = parseInt(key) as MovementDirection;
          if (Number.isNaN(keyDirection)) {
            return;
          }
          const newValue = turning[keyDirection];
          if (typeof newValue === 'boolean') {
            this.turning[keyDirection] = newValue;
          }
        });
        this.computeMovementInput();
      }
    }

    if (playerID !== undefined) {
      this.setPlayer(playerID);
      const player = this.getPlayer();
      if (player && player.hero !== this) {
        player.setHero(this);
      }
      this.updateExperience();
    }

    if (this.getPlayer()?.isActivePlayer?.() && wasInitialized) {
      // Use our angle
      this.angle = oldAngle;
      this.weaponAngle = oldWeaponAngle;
      this.targetAngle = oldTargetAngle;

      this.setPositionXY(oldX, oldY);
      this.velocity.setXY(oldVX, oldVY);
      EventManager.emitEvent(SyncHeroEvent, {
        hero: this.serialize(),
      });
    }

    if (!this.hasReplaced && isUUID(data.replacementId)) {
      const oldHero = WorldManager.getEntity(data.replacementId);
      if (oldHero instanceof BaseHero) {
        this.hasReplaced = true;
        this.setPosition(oldHero.position);
        this.copyMovement(oldHero);
      }
    }
  }

  public isEventSubject<E extends EventData>(event: Event<E>): boolean {
    const {socket} = event;
    const player = this.getPlayer();
    const isLocal = socket === undefined && player?.isActivePlayer();
    return isLocal || socket === player?.socket;
  }

  public override shouldUpdateLocally(): boolean {
    // Always update the current player's character
    // return this.getPlayer()?.isActivePlayer?.() ?? false;
    return true;
  }

  public override shouldSmooth(): boolean {
    return NetworkManager.isClient() && !this.getPlayer()?.isActivePlayer();
  }

  public override cleanup() {
    if (this.getPlayer()?.isActivePlayer()) {
      EventManager.emitEvent(BarUpdateEvent, {
        id: 'life-bar',
        value: 0,
        maxValue: this.getMaxLife(),
      });
    }
    super.cleanup();
  }
}

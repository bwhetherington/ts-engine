import {
  DamageEvent,
  Entity,
  KillEvent,
  Tank,
  TimedText,
  Unit,
  WorldManager,
} from 'core/entity';
import {
  Key,
  KeyAction,
  KeyEvent,
  MouseAction,
  MouseButton,
  MouseEvent,
  MovementDirection,
} from 'core/input';
import {Event, EventData, EventManager, Priority} from 'core/event';
import {Data} from 'core/serialize';
import {Player, PlayerManager} from 'core/player';
import {LogManager} from 'core/log';
import {NetworkManager} from 'core/net';
import {CameraManager} from 'core/graphics';
import {BarUpdateEvent, clamp} from 'core/util';
import {RNGManager} from 'core/random';
import {TextColor} from 'core/chat';
import {isUUID, UUID} from 'core/uuid';
import {ChangeStoredUpgradeCountEvent, Upgrade, UpgradeEvent, UpgradeManager} from 'core/upgrade';
import {Iterator} from 'core/iterator';

const log = LogManager.forFile(__filename);

export interface LevelUpEvent {
  id: UUID;
  from: number;
  to: number;
}

export interface SyncHeroEvent {
  hero: Data;
}

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
      EventManager.emit<ChangeStoredUpgradeCountEvent>({
        type: 'ChangeStoredUpgradeCountEvent',
        data: {storedUpgrades: val},
      });
    }
    this._storedUpgrades = val;
  }

  public constructor() {
    super();

    this.type = BaseHero.typeName;

    this.setWeapon('Gun');
    this.setExperience(0);
    this.setLevelInternal(1);

    this.streamEvents<MouseEvent>('MouseEvent', Priority.Normal, true)
      .filter((event) => this.isEventSubject(event))
      .forEach(({data: {action, x, y, button}}) => {
        if (action === MouseAction.Move) {
          // Subtract our position from mouse position
          this.vectorBuffer.setXY(x, y);
          this.vectorBuffer.add(this.position, -1);
          this.weaponAngle = this.vectorBuffer.angle;
          // this.targetAngle = this.vectorBuffer.angle;
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

    this.streamEvents<KeyEvent>('KeyEvent', Priority.Normal, true)
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
      this.streamEvents<DamageEvent>('DamageEvent')
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

    if (NetworkManager.isServer()) {
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

  public static initializeType() {
    EventManager.streamEvents<SyncHeroEvent>('SyncHeroEvent')
      // .debounce(1 / 30)
      .forEach((event) => {
        NetworkManager.sendEvent(event);
      });
  }

  public applyUpgrade(upgrade: Upgrade, isNew: boolean = true) {
    upgrade.applyTo(this);
    this.upgrades.push(upgrade.type);
    if (isNew) {
      EventManager.emit<UpgradeEvent>({
        type: 'UpgradeEvent',
        data: {
          hero: this,
          upgrade: upgrade,
        },
      });
    }
  }

  public copyUpgrades(other: BaseHero) {
    Iterator.array(other.upgrades)
      .filterMap((type) => UpgradeManager.instantiate(type))
      .forEach((upgrade) => this.applyUpgrade(upgrade, false));
  }

  public override getLifeRegen(): number {
    return this.modifiers.get('lifeRegen').multiplyPoint(super.getLifeRegen());
  }

  protected override getNameColor(): TextColor {
    return this.getPlayer()?.getNameColor() ?? super.getNameColor();
  }

  public override getXPWorth(): number {
    return Math.max(1, this.getExperience() / 2);
  }

  protected damageBonusForLevel(level: number): number {
    return 0;
  }

  protected experienceForLevel(level: number): number {
    if (level < 1) {
      return 0;
    }
    return level * 20 + Math.ceil(level * level * 3);
  }

  protected lifeForLevel(level: number): number {
    return 50 + (level - 1) * 5;
  }

  protected regenForLevel(_level: number): number {
    return 1 / 30;
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

    while (this.xp >= this.experienceForLevel(this.level) && this.level < 40) {
      const oldLevel = this.level;
      this.setLevelInternal(this.level + 1);
      if (NetworkManager.isServer() && allowLevels) {
        EventManager.emit<LevelUpEvent>({
          type: 'LevelUpEvent',
          data: {
            id: this.id,
            from: oldLevel,
            to: this.level,
          },
        });
      }
    }

    while (
      this.xp < this.experienceForLevel(this.level - 1) &&
      this.level > 1
    ) {
      this.setLevelInternal(this.level - 1);
    }

    if (this.getPlayer()?.isActivePlayer?.()) {
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

  public setLevel(level: number) {
    this.setLevelInternal(level);
    this.setExperience(this.experienceForLevel(level - 1));
  }

  public getLevel(): number {
    return this.level;
  }

  private setLevelInternal(level: number) {
    level = clamp(level, 1, 40);
    if (level !== this.level) {
      this.level = level;

      this.setMaxLife(this.lifeForLevel(level));
      this.armor = this.armorForLevel(level);
      this.lifeRegen = this.regenForLevel(level);
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
    const life = this.lifeForLevel(this.level);
    this.setMaxLife(life);
  }

  public override setMaxLife(maxLife: number) {
    let life = maxLife;
    if (NetworkManager.isServer() && this.modifiers) {
      life = Math.round(this.modifiers.get('life').multiplyPoint(life));
    }
    super.setMaxLife(life);
    if (this.getPlayer()?.isActivePlayer?.()) {
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

  public override setLife(life: number, source?: Unit) {
    super.setLife(life, source);
    if (this.getPlayer()?.isActivePlayer?.()) {
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
    this.vectorBuffer.setXY(0, 0);
    if (this.turning[MovementDirection.Up]) {
      this.vectorBuffer.addXY(0, -1);
    }
    if (this.turning[MovementDirection.Down]) {
      this.vectorBuffer.addXY(0, 1);
    }
    if (this.turning[MovementDirection.Left]) {
      this.vectorBuffer.addXY(-1, 0);
    }
    if (this.turning[MovementDirection.Right]) {
      this.vectorBuffer.addXY(1, 0);
    }
    this.vectorBuffer.normalize();
    if (this.vectorBuffer.magnitudeSquared > 0) {
      this.setThrusting(1);
      this.targetAngle = this.vectorBuffer.angle % (2 * Math.PI);
    } else {
      this.setThrusting(0);
      this.targetAngle = this.angle;
    }
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

      if (this.label) {
        this.label.tag = ` [${this.level}]`;
      }
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
    const {playerID, xp, storedUpgrades} = data;

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
        for (const key in this.turning) {
          const keyDirection = parseInt(key) as MovementDirection;
          if (Number.isNaN(keyDirection)) {
            continue;
          }
          const newValue = turning[keyDirection];
          if (typeof newValue === 'boolean') {
            this.turning[keyDirection] = newValue;
          }
        }
        this.computeMovementInput();
      }
    }

    if (playerID !== undefined) {
      this.setPlayer(playerID);
      const player = this.getPlayer();
      if (player && player.hero !== this) {
        player.setHero(this);
      }
    }

    if (this.getPlayer()?.isActivePlayer?.() && wasInitialized) {
      // Use our angle
      this.angle = oldAngle;
      this.weaponAngle = oldWeaponAngle;
      this.targetAngle = oldTargetAngle;

      this.setPositionXY(oldX, oldY);
      this.velocity.setXY(oldVX, oldVY);
      EventManager.emit<SyncHeroEvent>({
        type: 'SyncHeroEvent',
        data: {
          hero: this.serialize(),
        },
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

  public override calculateDamageIn(amount: number): number {
    const armor = this.modifiers.get('armor').multiplyPoint(this.armor);
    return Math.max(1, amount - armor);
  }

  public isEventSubject<E extends EventData>(event: Event<E>): boolean {
    const {socket} = event;
    const player = this.getPlayer();
    const isLocal = socket === undefined && player?.isActivePlayer();
    return isLocal || socket === player?.socket;
  }

  protected override calculateDamageOut(amount: number): number {
    return amount;
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
      EventManager.emit({
        type: 'BarUpdateEvent',
        data: <BarUpdateEvent>{
          id: 'life-bar',
          value: 0,
          maxValue: this.getMaxLife(),
        },
      });
    }
    super.cleanup();
  }
}

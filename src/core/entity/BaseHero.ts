import {
  WorldManager,
  DamageEvent,
  Tank,
  KillEvent,
  Unit,
  TimedText,
  Entity,
} from 'core/entity';
import {
  KeyEvent,
  KeyAction,
  MouseEvent,
  MouseAction,
  Key,
  MouseButton,
  MovementDirection,
} from 'core/input';
import {EventData, Event, EventManager, Priority} from 'core/event';
import {Data} from 'core/serialize';
import {Player, PlayerManager} from 'core/player';
import {LogManager} from 'core/log';
import {NetworkManager, SyncEvent} from 'core/net';
import {CameraManager, GraphicsContext, Sprite} from 'core/graphics';
import {BarUpdateEvent, clamp, sleep} from 'core/util';
import {RNGManager} from 'core/random';
import {TextColor} from 'core/chat';
import {UUID} from 'core/uuid';
import {Upgrade, UpgradeEvent, UpgradeManager} from 'core/upgrade';
import {Iterator} from 'core/iterator';
import {AssetManager} from 'core/assets';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {FireEvent} from 'core/weapon';

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
  private turning = {
    [MovementDirection.Up]: false,
    [MovementDirection.Down]: false,
    [MovementDirection.Left]: false,
    [MovementDirection.Right]: false,
  };
  private upgrades: string[] = [];

  private xp: number = 0;
  private level: number = 1;
  private cameraTarget?: Entity;
  private weaponSprite?: Sprite;

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
          text.setPositionXY(target.boundingBox.x, target.boundingBox.y);
          text.addPositionXY(
            RNGManager.nextInt(0, target.boundingBox.width + 1),
            RNGManager.nextInt(0, target.boundingBox.height + 1)
          );
          const color = this === target ? 'red' : 'yellow';
          text.textColor = color;
          text.isStatic = false;
          text.text = label;
          text.velocity.setXY(0, -60);
          // text.velocity.angle += RNGManager.nextFloat(-0.3, 0.3);
          text.friction = 50;
          text.textSize = 20;
        });

      this.streamEvents<FireEvent>('FireEvent')
        // .filter(() => !!this.weaponSprite)
        .filter(({data: {sourceID}}) => sourceID === this.id)
        .forEach(() => {
          this.weaponSprite?.playAnimation({
            animation: 'fire',
            next: {
              animation: 'stand',
              repeat: true,
            },
          });
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

  public render(ctx: GraphicsContext): void {
    super.render(ctx);
    GraphicsPipeline.pipe()
      .rotate(this.weaponAngle - this.angle)
      .run(ctx, (ctx) => {
        if (!this.weaponSprite) {
          return;
        }

        ctx.sprite(this.weaponSprite);
      });
  }

  public static initializeType(): void {
    EventManager.streamEvents<SyncHeroEvent>('SyncHeroEvent')
      // .debounce(1 / 30)
      .forEach((event) => {
        NetworkManager.sendEvent(event);
      });
  }

  public applyUpgrade(upgrade: Upgrade, isNew: boolean = true): void {
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

  public copyUpgrades(other: BaseHero): void {
    Iterator.array(other.upgrades)
      .filterMap((type) => UpgradeManager.instantiate(type))
      .forEach((upgrade) => this.applyUpgrade(upgrade, false));
  }

  public getLifeRegen(): number {
    return this.modifiers.get('lifeRegen').multiplyPoint(super.getLifeRegen());
  }

  protected getNameColor(): TextColor {
    return this.getPlayer()?.getNameColor() ?? super.getNameColor();
  }

  public getXPWorth(): number {
    return Math.max(1, this.getExperience() / 2);
  }

  protected damageBonusForLevel(level: number): number {
    return 0;
  }

  protected experienceForLevel(level: number): number {
    if (level < 1) {
      return 0;
    }
    return 5 * (3 + Math.ceil(level * level * 3));
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

  public addExperience(amount: number): void {
    this.setExperience(this.getExperience() + amount);
  }

  public setExperience(amount: number, allowLevels: boolean = true): void {
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
    const oldPlayer = this.player;
    let newPlayer;
    if (typeof player === 'number') {
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

  public updateMaxLife(): void {
    const life = this.lifeForLevel(this.level);
    this.setMaxLife(life);
  }

  public setMaxLife(maxLife: number): void {
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

  public setLife(life: number, source?: Unit): void {
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

  public getName(): string {
    return this.getPlayer()?.name ?? super.getName();
  }

  private computeMovementInput(): void {
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
      // this.angle = this.angle;
    }
  }

  public step(dt: number): void {
    this.computeMovementInput();
    this.weaponSprite?.step(dt);
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
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      playerID: this.player?.id,
      xp: this.xp,
    };
  }

  public deserialize(data: Data, setInitialized?: boolean): void {
    const {x: oldX, y: oldY} = this.position;
    const {x: oldVX, y: oldVY} = this.velocity;
    const {
      angle: oldAngle,
      weaponAngle: oldWeaponAngle,
      targetAngle: oldTargetAngle,
    } = this;
    const {playerID, xp, modifiers} = data;

    if (typeof xp === 'number') {
      this.setExperience(xp);
    }

    const wasInitialized = this.isInitialized;
    super.deserialize(data, setInitialized);

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
  }

  public calculateDamageIn(amount: number): number {
    const armor = this.modifiers.get('armor').multiplyPoint(this.armor);
    return Math.max(1, amount - armor);
  }

  public isEventSubject<E extends EventData>(event: Event<E>): boolean {
    const {socket} = event;
    const player = this.getPlayer();
    const isLocal = socket === undefined && player?.isActivePlayer();
    return isLocal || socket === player?.socket;
  }

  protected calculateDamageOut(amount: number): number {
    return amount;
  }

  public shouldUpdateLocally(): boolean {
    // Always update the current player's character
    // return this.getPlayer()?.isActivePlayer?.() ?? false;
    return true;
  }

  public shouldSmooth(): boolean {
    return NetworkManager.isClient() && !this.getPlayer()?.isActivePlayer();
  }

  public cleanup(): void {
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

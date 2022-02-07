import {
  Aura,
  Entity,
  DamageEvent,
  KillEvent,
  Bar,
  Text,
  WorldManager,
  Echo,
  CollisionLayer,
  Trail,
} from '@/core/entity';
import {Data, deserializeMapNumber, serialize} from '@/core/serialize';
import {Vector} from '@/core/geometry';
import {clamp} from '@/core/util';
import {Event, EventManager} from '@/core/event';
import {NetworkManager} from '@/core/net';
import {Color, COLOR_NAMES, reshade} from '@/core/graphics';
import {TextColor} from '@/core/chat';
import {Effect, EffectManager} from '@/core/effect';
import {UUID} from '@/core/uuid';
import {Iterator} from '@/core/iterator';
import {isAssetIdentifier} from '@/core/assets';

const ACCELERATION = 2000;
const FLASH_DURATION = 0.1;

export enum Team {
  Blue,
  Red,
  Green,
  Yellow,
}

const TEAM_COLORS: Record<Team, Color> = {
  [Team.Blue]: COLOR_NAMES.blue,
  [Team.Red]: COLOR_NAMES.red,
  [Team.Green]: COLOR_NAMES.green,
  [Team.Yellow]: COLOR_NAMES.yellow,
};

export class Unit extends Entity {
  public static typeName: string = 'Unit';
  public static isTypeInitialized: boolean = false;

  public team?: Team;

  private name: string = '';
  private maxLife: number = 10;
  private life: number = 10;
  private isImmune: boolean = false;
  protected lifeRegen: number = 0;
  protected lifeRegenDelay: number = 3;
  protected speed: number = 250;
  private xpWorth: number = 1;

  public label?: Text;
  protected hpBar?: Bar;
  protected trail?: Trail;
  protected thrusting: number = 0;
  protected effectCounts: Map<string, number> = new Map();

  private lastFlash: number = 0;
  private flashColor?: Color;
  private isAliveInternal: boolean = true;
  private acceleration: Vector = new Vector(0, 0);
  private hasExploded: boolean = false;

  private effects: Map<UUID, Effect> = new Map();
  private auras: Set<Aura> = new Set();

  public constructor() {
    super();
    this.type = Unit.typeName;

    if (NetworkManager.isClient()) {
      this.hpBar = WorldManager.spawn(Bar, this.position);
    }

    this.isSpatial = true;
  }

  public static initializeType() {
    Entity.initializeType();
    if (!Unit.isTypeInitialized) {
      Unit.isTypeInitialized = true;
      if (NetworkManager.isClient()) {
        EventManager.streamEvents<DamageEvent>('DamageEvent')
          .filterMap((event) => WorldManager.getEntity(event.data.targetID))
          .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
          .forEach((unit) => unit.flash());
      }
    }
  }

  public setTeam(team: Team) {
    this.team = team;
    this.setColor(TEAM_COLORS[team]);
  }

  public isHostileTo(other: Unit): boolean {
    if (this.id === other.id) {
      return false;
    }
    if (this.team === undefined) {
      return true;
    }
    return this.team !== other.team;
  }

  public addEffect(effect: Effect) {
    if (!this.isAlive()) {
      effect.cleanup();
      return;
    }

    this.effects.set(effect.id, effect);

    const count = this.effectCounts.get(effect.type) ?? 0;
    this.effectCounts.set(effect.type, count + 1);

    effect.target = this;
    effect.onStart();
  }

  public getLifeRegenDelay(): number {
    return this.lifeRegenDelay;
  }

  public addAura(aura: Aura) {
    if (!this.isAlive()) {
      aura.markForDelete();
      return;
    }
    this.auras.add(aura);
  }

  public removeEffect(effect: Effect) {
    effect.onEnd();
    this.effects.delete(effect.id);
    delete effect.target;

    const count = this.effectCounts.get(effect.type);
    if (count !== undefined) {
      this.effectCounts.set(effect.type, count - 1);
    }

    effect.cleanup();
  }

  public removeAura(aura: Aura) {
    this.auras.delete(aura);
  }

  public hasEffect(type: string): boolean {
    return (this.effectCounts.get(type) ?? 0) > 0;
  }

  public setIsImmune(isImmune: boolean) {
    this.isImmune = isImmune;
  }

  public getIsImmune(): boolean {
    return this.isImmune;
  }

  public override cleanup() {
    this.hpBar?.markForDelete();
    this.label?.markForDelete();
    if (NetworkManager.isClient() && !this.hasExploded) {
      this.explode();
    }
    super.cleanup();

    for (const effect of this.effects.values()) {
      effect.cleanup();
    }
    for (const aura of this.auras) {
      aura.markForDelete();
    }

    this.isAliveInternal = false;
  }

  public override isAlive(): boolean {
    return this.isAliveInternal && super.isAlive();
  }

  public getLife(): number {
    return this.life;
  }

  public setLife(life: number, source?: Unit) {
    this.life = clamp(life, 0, this.maxLife);
    if (this.life <= 0) {
      this.kill(source);
    }
  }

  protected calculateDamageOut(amount: number): number {
    return amount;
  }

  protected calculateDamageIn(amount: number): number {
    return amount;
  }

  protected onDamageIn(_amount: number, _source?: Unit) {}

  protected onDamageOut(_amount: number, _target: Unit) {}

  public heal(amount: number) {
    this.setLife(this.life + amount);
  }

  public damage(amount: number, source?: Unit, isPure?: boolean) {
    if (this.isImmune) {
      return;
    }

    let actualDamage: number;

    if (isPure) {
      actualDamage = amount;
    } else {
      const damageOut = source?.calculateDamageOut(amount) ?? amount;
      const damageIn = this.calculateDamageIn(damageOut);
      actualDamage = damageIn;
    }

    if (actualDamage <= 0) {
      return;
    }

    this.setLife(this.life - actualDamage, source);
    const event = {
      type: 'DamageEvent',
      data: {
        targetID: this.id,
        sourceID: source?.id,
        amount: actualDamage,
      },
    };
    EventManager.emit<DamageEvent>(event);
    WorldManager.batchDamageEvent(event.data);

    if (amount > 0) {
      if (!isPure) {
        this.onDamageIn(actualDamage, source);
        source?.onDamageOut(actualDamage, this);
      }
      this.flash();
    }
  }

  public getXPWorth(): number {
    return this.xpWorth;
  }

  public setXPWorth(amount: number) {
    this.xpWorth = amount;
  }

  public getMaxLife(): number {
    return this.maxLife;
  }

  public setName(name: string) {
    this.name = name;
    if (this.label) {
      this.label.text = name;
    }
  }

  public getName(): string {
    return this.name;
  }

  public setMaxLife(life: number, reset?: boolean) {
    this.maxLife = life;
    if (reset) {
      this.setLife(life);
    } else {
      this.setLife(this.life);
    }
  }

  protected getNameColor(): TextColor {
    return 'none';
  }

  public getLifeRegen(): number {
    return this.lifeRegen;
  }

  protected getRegenForStep(dt: number): number {
    const timeSinceDamage = EventManager.timeElapsed - this.lastFlash;
    if (timeSinceDamage >= this.getLifeRegenDelay()) {
      return this.getLifeRegen() * this.getMaxLife() * dt;
    }
    return 0;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public override step(dt: number) {
    // Regenerate life
    this.setLife(this.life);
    if (NetworkManager.isServer()) {
      this.setLife(this.life + this.getRegenForStep(dt));
    }

    // Handle movement
    this.acceleration.setXY(1, 0);
    this.acceleration.angle = this.angle;

    this.acceleration.magnitude =
      ACCELERATION * dt * this.thrusting * this.getMass();
    this.applyForce(this.acceleration);

    // Handle maximum speed
    const speed = this.getSpeed();
    if (this.velocity.magnitude > speed) {
      // If we've exceeded the maximum velocity, apply a scaling friction
      const excess = this.velocity.magnitude - speed;
      this.vectorBuffer.set(this.velocity);
      this.vectorBuffer.normalize();
      this.vectorBuffer.scale(-excess);
      this.velocity.add(this.vectorBuffer);
    }

    // Update effects
    const toRemove = [];
    if (this.effects) {
      for (const effect of this.effects.values()) {
        effect.step(dt);
        if (effect.isMarkedForDelete) {
          toRemove.push(effect);
        }
      }
    }

    toRemove.forEach(this.removeEffect.bind(this));

    super.step(dt);
  }

  public override afterStep() {
    if (NetworkManager.isClient()) {
      if (this.label) {
        this.label.position.set(this.position);
        this.label.position.addXY(0, -(this.boundingBox.height + 10));
        this.label.textColor = this.getNameColor();
        this.label.text = this.getName();
      }

      if (this.hpBar) {
        this.hpBar.position.set(this.position);
        this.hpBar.position.addXY(0, this.boundingBox.height + 12);
        this.hpBar.velocity.set(this.velocity);
        this.hpBar.progress = this.getLife() / this.getMaxLife();
      }
    }
  }

  public setThrusting(thrusting: number) {
    this.thrusting = thrusting;
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      life: this.life,
      maxLife: this.maxLife,
      speed: this.speed,
      xpWorth: this.xpWorth,
      name: this.name,
      thrusting: this.thrusting,
      isImmune: this.isImmune,
      color: this.getBaseColor(),
      effectCounts: serialize(this.effectCounts),
      lifeRegen: this.lifeRegen,
      lifeRegenDelay: this.lifeRegenDelay,
    };
  }

  public override deserialize(data: Data, setInitialized?: boolean) {
    super.deserialize(data, setInitialized);
    const {
      life,
      maxLife,
      thrusting,
      isImmune,
      xpWorth,
      speed,
      name,
      effectCounts,
      lifeRegen,
      lifeRegenDelay,
      initialEffects,
      initialAuras,
    } = data;
    if (typeof lifeRegen === 'number') {
      this.lifeRegen = lifeRegen;
    }
    if (typeof lifeRegenDelay === 'number') {
      this.lifeRegenDelay = lifeRegenDelay;
    }
    if (typeof maxLife === 'number') {
      this.setMaxLife(maxLife);
    }
    if (typeof life === 'number') {
      this.setLife(life);
    }
    if (typeof speed === 'number') {
      this.speed = speed;
    }
    if (typeof xpWorth === 'number') {
      this.xpWorth = xpWorth;
    }
    if (typeof name === 'string' && name.length > 0) {
      this.setName(name);
    }
    if (typeof thrusting === 'number') {
      this.setThrusting(thrusting);
    }
    if (typeof isImmune === 'boolean') {
      this.isImmune = isImmune;
    }
    if (typeof effectCounts === 'object') {
      deserializeMapNumber(effectCounts, this.effectCounts);
    }
    if (initialEffects instanceof Array) {
      Iterator.array(initialEffects)
        .filterType(isAssetIdentifier)
        .filterMap((identifier) => EffectManager.instantiate(identifier))
        .forEach((effect) => {
          effect.source = this;
          this.addEffect(effect);
        });
    }
    if (initialAuras instanceof Array) {
      Iterator.array(initialAuras)
        .filterType(isAssetIdentifier)
        .filterMap((identifier) => WorldManager.instantiate(identifier))
        .forEach((entity) => {
          if (entity instanceof Aura) {
            WorldManager.add(entity);
            entity.initialize(this);
            this.addAura(entity);
          } else {
            entity.cleanup();
          }
        });
    }
  }

  public cleanupLocal() {
    this.label?.markForDelete();
    this.hpBar?.markForDelete();
    if (!this.hasExploded) {
      this.explode();
    }
  }

  protected explode() {
    const echo = WorldManager.spawn(Echo, this.position);
    echo?.initialize(this, true);

    if (this.label) {
      const labelEcho = WorldManager.spawn(Echo, this.label.position);
      labelEcho?.initialize(this.label, false);
    }

    if (this.hpBar) {
      this.hpBar.progress = 0;
      const barEcho = WorldManager.spawn(Echo, this.hpBar.position);
      barEcho?.initialize(this.hpBar, true);
    }

    this.hasExploded = true;
  }

  public kill(source?: Unit) {
    if (NetworkManager.isServer()) {
      this.markForDelete();
      if (this.isAliveInternal) {
        const event: Event<KillEvent> = {
          type: 'KillEvent',
          data: {
            targetID: this.id,
            sourceID: source?.id,
          },
        };
        NetworkManager.sendEvent(event);
        event.data.target = this;
        event.data.source = source;
        EventManager.emit(event);
        this.isAliveInternal = false;
      }
    }
  }

  public flash() {
    this.lastFlash = EventManager.timeElapsed;
  }

  public getBaseColor(): Color {
    return this.color;
  }

  public override getColor(): Color {
    const color =
      EventManager.timeElapsed - this.lastFlash < FLASH_DURATION &&
      this.isAlive()
        ? this.flashColor ?? this.color
        : this.color;
    return color;
  }

  public override setColor(color: Color) {
    super.setColor(color);
    this.flashColor = reshade(this.color, 0.5);
  }

  public override collide(other?: Entity) {
    if (other && other.collisionLayer === CollisionLayer.Unit) {
      this.vectorBuffer.set(other.position);
      this.vectorBuffer.add(this.position, -1);
      this.vectorBuffer.normalize();
      other.applyForce(
        this.vectorBuffer,
        this.getMass() * 300 * EventManager.lastStepDt
      );
    }
  }
}

import {
  Entity,
  DamageEvent,
  KillEvent,
  Bar,
  Text,
  WorldManager,
  Echo,
} from 'core/entity';
import {Data} from 'core/serialize';
import {MovementDirection} from 'core/input';
import {Vector} from 'core/geometry';
import {clamp} from 'core/util';
import {EventManager} from 'core/event';
import {NetworkManager} from 'core/net';
import {Color, reshade, GraphicsContext} from 'core/graphics';
import {CollisionLayer} from './util';
import {TextColor} from 'core/chat';

const ACCELERATION = 2000;
const FLASH_DURATION = 0.1;

export class Unit extends Entity {
  public static typeName: string = 'Unit';

  private name: string = '';
  private maxLife: number = 10;
  private life: number = 10;
  protected lifeRegen: number = 0;
  protected speed: number = 250;
  private xpWorth: number = 1;

  protected label?: Text;
  protected hpBar?: Bar;

  private flashTimer: number = 0;
  private flashColor?: Color;
  private isAliveInternal: boolean = true;
  private movement = {
    [MovementDirection.Up]: false,
    [MovementDirection.Down]: false,
    [MovementDirection.Left]: false,
    [MovementDirection.Right]: false,
  };
  private acceleration: Vector = new Vector(0, 0);
  private hasExploded: boolean = false;

  public constructor() {
    super();
    this.type = Unit.typeName;

    if (NetworkManager.isClient()) {
      this.hpBar = WorldManager.spawn(Bar, this.position);
    }
  }

  public cleanup(): void {
    this.label?.markForDelete();
    this.hpBar?.markForDelete();
    if (NetworkManager.isClient() && !this.hasExploded) {
      this.explode();
    }
    super.cleanup();
    this.isAliveInternal = false;
  }

  public get isAlive(): boolean {
    return this.isAliveInternal;
  }

  public getLife(): number {
    return this.life;
  }

  public setLife(life: number, source?: Unit): void {
    this.life = clamp(life, 0, this.maxLife);
    if (this.life === 0) {
      this.kill(source);
    }
  }

  protected calculateDamageOut(amount: number, target: Unit): number {
    return amount;
  }

  protected calculateDamageIn(amount: number, source?: Unit): number {
    return amount;
  }

  public damage(amount: number, source?: Unit): void {
    const damageOut = source?.calculateDamageOut(amount, this) ?? amount;
    const damageIn = this.calculateDamageIn(damageOut, source);
    this.setLife(this.life - damageIn, source);
    const event = {
      type: 'DamageEvent',
      data: {
        targetID: this.id,
        sourceID: source?.id,
        amount: damageIn,
      },
    };
    EventManager.emit<DamageEvent>(event);
    if (NetworkManager.isServer()) {
      NetworkManager.send(event);
    }
    if (amount > 0) {
      this.flash();
    }
  }

  public getXPWorth(): number {
    return this.xpWorth;
  }

  public setXPWorth(amount: number): void {
    this.xpWorth = amount;
  }

  public getMaxLife(): number {
    return this.maxLife;
  }

  public setName(name: string): void {
    this.name = name;
    if (this.label) {
      this.label.text = name;
    }
  }

  public getName(): string {
    return this.name;
  }

  public setMaxLife(life: number, reset?: boolean): void {
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

  public step(dt: number): void {
    // Regenerate life
    this.setLife(this.life + this.lifeRegen * dt);

    // Handle movement
    this.acceleration.setXY(0, 0);

    if (this.movement[MovementDirection.Up]) {
      this.acceleration.addXY(0, -1);
    }

    if (this.movement[MovementDirection.Down]) {
      this.acceleration.addXY(0, 1);
    }

    if (this.movement[MovementDirection.Left]) {
      this.acceleration.addXY(-1, 0);
    }

    if (this.movement[MovementDirection.Right]) {
      this.acceleration.addXY(1, 0);
    }

    this.acceleration.magnitude = ACCELERATION * dt;
    this.applyForce(this.acceleration, (this.mass * this.friction) / 500);

    // Handle maximum speed
    if (this.velocity.magnitude > this.speed) {
      const excess = this.velocity.magnitude - this.speed;
      this.vectorBuffer.set(this.velocity);
      this.vectorBuffer.normalize();
      this.vectorBuffer.scale(-excess);
      this.velocity.add(this.vectorBuffer);
    }

    super.step(dt);

    if (NetworkManager.isClient()) {
      if (this.label) {
        this.label.position.set(this.position);
        this.label.position.addXY(0, -(this.boundingBox.height + 10));
        this.label.velocity.set(this.velocity);
        this.label.textColor = this.getNameColor();
        this.label.text = this.getName();
      }

      if (this.hpBar) {
        this.hpBar.position.set(this.position);
        this.hpBar.velocity.set(this.velocity);
        this.hpBar.position.addXY(0, this.boundingBox.height + 12);
        this.hpBar.progress = this.getLife() / this.getMaxLife();
      }
    }

    this.flashTimer = Math.max(0, this.flashTimer - dt);
  }

  public setMovement(direction: MovementDirection, state: boolean): void {
    this.movement[direction] = state;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      life: this.life,
      maxLife: this.maxLife,
      speed: this.speed,
      xpWorth: this.xpWorth,
      name: this.name,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {life, maxLife, movement, xpWorth, speed, name} = data;
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
    if (typeof name === 'string') {
      this.setName(name);
    }
    if (movement) {
      if (MovementDirection.Up in movement) {
        this.setMovement(MovementDirection.Up, movement[MovementDirection.Up]);
      }

      if (MovementDirection.Down in movement) {
        this.setMovement(
          MovementDirection.Down,
          movement[MovementDirection.Down]
        );
      }

      if (MovementDirection.Left in movement) {
        this.setMovement(
          MovementDirection.Left,
          movement[MovementDirection.Left]
        );
      }

      if (MovementDirection.Right in movement) {
        this.setMovement(
          MovementDirection.Right,
          movement[MovementDirection.Right]
        );
      }
    }
  }

  public cleanupLocal(): void {
    this.label?.markForDelete();
    this.hpBar?.markForDelete();
    if (!this.hasExploded) {
      this.explode();
    }
  }

  protected explode(): void {
    const echo = WorldManager.spawn(Echo, this.position);
    echo.initialize(this, true);

    if (this.label) {
      const labelEcho = WorldManager.spawn(Echo, this.label.position);
      labelEcho.initialize(this.label, false);
    }

    if (this.hpBar) {
      const barEcho = WorldManager.spawn(Echo, this.hpBar.position);
      barEcho.initialize(this.hpBar, true);
    }

    this.hasExploded = true;
  }

  public kill(source?: Unit): void {
    if (NetworkManager.isServer()) {
      this.markForDelete();
    }

    EventManager.emit<KillEvent>({
      type: 'KillEvent',
      data: {
        targetID: this.id,
        sourceID: source?.id,
      },
    });
  }

  public flash(): void {
    this.flashTimer = FLASH_DURATION;
  }

  public getBaseColor(): Color {
    return this.color;
  }

  public getColor(): Color {
    const color =
      this.flashTimer > 0 && this.isAlive
        ? this.flashColor ?? this.color
        : this.color;
    return color;
  }

  public setColor(color: Color): void {
    super.setColor(color);
    this.flashColor = reshade(this.color, -0.4);
  }

  public collide(other?: Entity): void {
    if (
      NetworkManager.isServer() &&
      other &&
      other.collisionLayer === CollisionLayer.Unit
    ) {
      this.vectorBuffer.set(other.position);
      this.vectorBuffer.add(this.position, -1);
      this.vectorBuffer.normalize();
      other.applyForce(this.vectorBuffer, this.mass * 10);
    }
  }
}

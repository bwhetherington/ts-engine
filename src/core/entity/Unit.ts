import { Entity, DamageEvent, KillEvent } from 'core/entity';
import { Data } from 'core/serialize';
import { MovementDirection } from 'core/input';
import { Vector } from 'core/geometry';
import { clamp } from 'core/util';
import { Weapon, WeaponManager } from 'core/weapon';
import { EventManager } from 'core/event';
import { NetworkManager } from 'core/net';

const ACCELERATION = 2000;

export class Unit extends Entity {
  public static typeName: string = 'Unit';

  private maxLife: number = 10;
  private life: number = 10;
  protected lifeRegen: number = 0;
  protected speed: number = 250;
  private isAliveInternal: boolean = true;
  private movement = {
    [MovementDirection.Up]: false,
    [MovementDirection.Down]: false,
    [MovementDirection.Left]: false,
    [MovementDirection.Right]: false,
  };
  private acceleration: Vector = new Vector(0, 0);
  private weapon?: Weapon;

  public constructor() {
    super();
    this.type = Unit.typeName;
  }

  public setWeapon(weapon?: Weapon): void {
    if (this.weapon && this.weapon !== weapon) {
      this.weapon.cleanup();
      this.weapon = weapon;
    } else if (weapon) {
      this.weapon = weapon;
    }
  }

  public cleanup(): void {
    super.cleanup();
    this.weapon?.cleanup();
    this.isAliveInternal = false;
  }

  public get isAlive(): boolean {
    return this.isAliveInternal;
  }

  public fire(angle: number): void {
    this.weapon?.fireInternal(this, angle);
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

  public damage(amount: number, source?: Unit): void {
    this.setLife(this.life - amount, source);
    EventManager.emit<DamageEvent>({
      type: 'DamageEvent',
      data: {
        target: this,
        source,
        amount,
      },
    });
  }

  public getMaxLife(): number {
    return this.maxLife;
  }

  public setMaxLife(life: number): void {
    this.maxLife = life;
    this.setLife(this.life);
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
  }

  public setMovement(direction: MovementDirection, state: boolean): void {
    this.movement[direction] = state;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      life: this.life,
      maxLife: this.maxLife,
      weapon: this.weapon?.serialize(),
      speed: this.speed,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const { life, maxLife, movement, weapon, speed } = data;
    if (typeof maxLife === 'number') {
      this.setMaxLife(maxLife);
    }
    if (typeof life === 'number') {
      this.setLife(life);
    }
    if (typeof speed === 'number') {
      this.speed = speed;
    }
    if (weapon) {
      const { type } = weapon;
      if (type && this.weapon?.type !== type) {
        const newWeapon = WeaponManager.createWeapon(type);
        if (newWeapon) {
          newWeapon.deserialize(weapon);
          this.setWeapon(newWeapon);
        }
      } else {
        this.weapon?.deserialize(weapon);
      }
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

  public cleanupLocal(): void {}

  public kill(source?: Unit): void {
    if (NetworkManager.isServer()) {
      this.markForDelete();
    }

    EventManager.emit<KillEvent>({
      type: 'KillEvent',
      data: {
        target: this,
        source,
      },
    });
  }
}

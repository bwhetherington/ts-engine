import { Entity, Hero } from 'core/entity';
import { Data } from 'core/serialize';
import { MovementDirection } from 'core/input';
import { Vector } from 'core/geometry';
import { clamp } from 'core/util';
import { DamageEvent } from './util';

const ACCELERATION = 2000;

export class Unit extends Entity {
  public static typeName: string = 'Unit';

  private maxLife: number = 100;
  private life: number = 100;
  private lifeRegen: number = 5;
  private speed: number = 250;
  private movement = {
    [MovementDirection.Up]: false,
    [MovementDirection.Down]: false,
    [MovementDirection.Left]: false,
    [MovementDirection.Right]: false,
  };
  private acceleration: Vector = new Vector(0, 0);

  public constructor() {
    super();
    this.type = Unit.typeName;

    this.addListener<DamageEvent>('DamageEvent', event => {
      const { target, source, amount } = event.data;
      if (target === this) {
        this.damage(amount);
      }
    });
  }

  public getLife(): number {
    return this.life;
  }

  public setLife(life: number): void {
    this.life = clamp(life, 0, this.maxLife);
    if (this.life === 0) {
      this.kill();
    }
  }

  public damage(amount: number): void {
    this.setLife(this.life - amount);
    console.log('damage', amount, this.life);
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
    this.applyForce(this.acceleration);

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
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const { life, maxLife, movement } = data;
    if (typeof maxLife === 'number') {
      this.setMaxLife(maxLife);
    }
    if (typeof life === 'number') {
      this.setLife(life);
    }
    if (movement) {
      if (MovementDirection.Up in movement) {
        this.setMovement(MovementDirection.Up, movement[MovementDirection.Up]);
      }

      if (MovementDirection.Down in movement) {
        this.setMovement(MovementDirection.Down, movement[MovementDirection.Down]);
      }

      if (MovementDirection.Left in movement) {
        this.setMovement(MovementDirection.Left, movement[MovementDirection.Left]);
      }

      if (MovementDirection.Right in movement) {
        this.setMovement(
          MovementDirection.Right,
          movement[MovementDirection.Right]
        );
      }
    }
  }

  public kill(): void {
    this.markForDelete();
  }
}

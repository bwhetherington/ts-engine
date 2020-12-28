import {Serializable, Data} from 'core/serialize';
import {Tank} from 'core/entity';
import {EventManager, StepEvent, Event} from 'core/event';
import {UUID} from 'core/uuid';
import {FireEvent} from 'core/weapon';
import {NetworkManager} from 'core/net';
import {RNGManager} from 'core/random';

export abstract class Weapon implements Serializable {
  public static typeName: string = 'Weapon';

  public type: string = Weapon.typeName;
  public rate: number = 1;
  public shots: number = 1;
  public shotSpread: number = 0.3;
  public damage: number = 0;
  private cooldown: number = 0;
  private id?: UUID;

  public constructor() {
    this.id = EventManager.addListener<StepEvent>('StepEvent', (event) => {
      const {dt} = event.data;
      this.cooldown = Math.max(this.cooldown - dt, 0);
    });
  }

  public cleanup(): void {
    if (this.id !== undefined) {
      EventManager.removeListener('StepEvent', this.id);
    }
  }

  public abstract fire(source: Tank, angle: number): void;

  public fireInternal(source: Tank, angle: number): void {
    if (this.cooldown <= 0) {
      this.cooldown += this.rate;

      // Spread shots out
      const baseAngleOffset = ((this.shots - 1) * this.shotSpread) / 2;
      for (let i = 0; i < this.shots; i++) {
        const angleOffset = i * this.shotSpread - baseAngleOffset;
        this.fire(source, angle + angleOffset);
      }

      const event: Event<FireEvent> = {
        type: 'FireEvent',
        data: {sourceID: source.id},
      };
      EventManager.emit(event);
      if (NetworkManager.isServer()) {
        NetworkManager.send(event);
      }
    }
  }

  public serialize(): Data {
    return {
      type: this.type,
      rate: this.rate,
      cooldown: this.cooldown,
      damage: this.damage,
      shots: this.shots,
      shotSpread: this.shotSpread,
    };
  }

  public deserialize(data: Data): void {
    const {type, rate, cooldown, damage, shots, shotSpread} = data;

    if (typeof type === 'string') {
      this.type = type;
    }

    if (typeof rate === 'number') {
      this.rate = rate;
    }

    if (typeof cooldown === 'number') {
      this.cooldown = cooldown;
    }

    if (typeof damage === 'number') {
      this.damage = damage;
    }

    if (typeof shots === 'number') {
      this.shots = shots;
    }

    if (typeof shotSpread === 'number') {
      this.shotSpread = shotSpread;
    }
  }

  protected rollDamage(): number {
    const roll = RNGManager.nextFloat(-this.damage / 5, this.damage / 5);
    return Math.max(1, this.damage + roll);
  }
}

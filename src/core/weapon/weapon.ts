import { Serializable, Data } from 'core/serialize';
import { Unit } from 'core/entity';
import { EM, StepEvent } from 'core/event';

export abstract class Weapon implements Serializable {
  public static typeName: string = 'Weapon';

  public type: string = Weapon.typeName;
  private rate: number = 1;
  private cooldown: number = 0;
  private listenerID?: string;

  public constructor() {
    this.listenerID = EM.addListener<StepEvent>('StepEvent', (event) => {
      const { dt } = event.data;
      this.cooldown = Math.max(this.cooldown - dt, 0);
    });
  }

  public cleanup(): void {
    if (this.listenerID !== undefined) {
      EM.removeListener('StepEvent', this.listenerID);
    }
  }

  public abstract fire(source: Unit, tx: number, ty: number): void;

  public fireInternal(source: Unit, tx: number, ty: number): void {
    if (this.cooldown <= 0) {
      this.cooldown += this.rate;
      this.fire(source, tx, ty);
    }
  }

  public serialize(): Data {
    return {
      type: this.type,
      rate: this.rate,
      cooldown: this.cooldown,
    };
  }

  public deserialize(data: Data): void {
    const { type, rate, cooldown } = data;

    if (typeof type === 'string') {
      this.type = type;
    }

    if (typeof rate === 'number') {
      this.rate = rate;
    }

    if (typeof cooldown === 'number') {
      this.cooldown = cooldown;
    }
  }
}

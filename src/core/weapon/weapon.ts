import { Serializable, Data } from 'core/serialize';
import { Unit } from 'core/entity';
import { EventManager, StepEvent, Event } from 'core/event';
import { UUID } from 'core/uuid';
import { FireEvent } from '.';
import { NetworkManager } from 'core/net';

export abstract class Weapon implements Serializable {
  public static typeName: string = 'Weapon';

  public type: string = Weapon.typeName;
  public rate: number = 1;
  private cooldown: number = 0;
  private id?: UUID;

  public constructor() {
    this.id = EventManager.addListener<StepEvent>('StepEvent', (event) => {
      const { dt } = event.data;
      this.cooldown = Math.max(this.cooldown - dt, 0);
    });
  }

  public cleanup(): void {
    if (this.id !== undefined) {
      EventManager.removeListener('StepEvent', this.id);
    }
  }

  public abstract fire(source: Unit, angle: number): void;

  public fireInternal(source: Unit, angle: number): void {
    if (this.cooldown <= 0) {
      this.cooldown += this.rate;
      this.fire(source, angle);
      const event: Event<FireEvent> = {
        type: 'FireEvent',
        data: { sourceID: source.id },
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

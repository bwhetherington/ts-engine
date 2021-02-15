import {Serializable, Data} from 'core/serialize';
import {Tank} from 'core/entity';
import {EventManager, StepEvent, Event} from 'core/event';
import {UUID} from 'core/uuid';
import {FireEvent} from 'core/weapon';
import {NetworkManager} from 'core/net';
import {RNGManager} from 'core/random';
import {HeroModifier} from 'core/upgrade';

export abstract class Weapon implements Serializable {
  public static typeName: string = 'Weapon';

  public type: string = Weapon.typeName;
  public rate: number = 1;
  public shotCount: number = 1;
  public shotSpread: number = 0.3;
  public damage: number = 0;
  public pierce: number = 1;
  private cooldown: number = 0;
  private id?: UUID;

  public constructor() {
    this.id = EventManager.addListener<StepEvent>('StepEvent', (event) => {
      const {dt} = event.data;
      if (this.cooldown > 0) {
        this.cooldown -= dt;
      }
    });
  }

  public cleanup(): void {
    if (this.id !== undefined) {
      EventManager.removeListener('StepEvent', this.id);
    }
  }

  public abstract fire(
    source: Tank,
    angle: number,
    modifier?: HeroModifier
  ): void;

  public fireInternal(
    source: Tank,
    angle: number,
    modifier?: HeroModifier
  ): void {
    while (this.cooldown <= 0) {
      let rate = this.rate;
      let shotCount = this.shotCount;
      let shotSpread = this.shotSpread;
      if (modifier) {
        rate = modifier.rate.multiplyPoint(rate);
        shotCount = Math.round(modifier.shotCount.multiplyPoint(shotCount));
        shotSpread = modifier.shotSpread.multiplyPoint(shotSpread);
      }

      this.cooldown += rate;

      // Spread shots out
      const deltaAngle = shotSpread / shotCount;
      const baseAngleOffset = (deltaAngle * (shotCount - 1)) / 2;
      for (let i = 0; i < shotCount; i++) {
        const angleOffset = i * deltaAngle - baseAngleOffset;
        this.fire(source, angle + angleOffset, modifier);
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
      shotCount: this.shotCount,
      shotSpread: this.shotSpread,
      pierce: this.pierce,
    };
  }

  public deserialize(data: Data): void {
    const {type, rate, cooldown, damage, shotCount, shotSpread, pierce} = data;

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

    if (typeof shotCount === 'number') {
      this.shotCount = shotCount;
    }

    if (typeof shotSpread === 'number') {
      this.shotSpread = (shotSpread * Math.PI) / 180;
    }

    if (typeof pierce === 'number') {
      this.pierce = pierce;
    }
  }

  protected rollDamage(modifier?: HeroModifier): number {
    let {damage} = this;
    if (modifier) {
      damage = modifier.damage.multiplyPoint(damage);
    }
    // const roll = RNGManager.nextFloat(-damage / 5, damage / 5);
    return Math.max(1, damage);
  }
}

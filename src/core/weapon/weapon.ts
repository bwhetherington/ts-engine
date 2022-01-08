import {Serializable, Data} from 'core/serialize';
import {Tank, Unit} from 'core/entity';
import {EventManager, StepEvent, Event} from 'core/event';
import {UUID} from 'core/uuid';
import {FireEvent} from 'core/weapon';
import {NetworkManager} from 'core/net';
import {RNGManager} from 'core/random';
import {HeroModifier} from 'core/upgrade';
import {EffectManager} from 'core/effect';
import {AssetIdentifier, isAssetIdentifier} from 'core/assets';

export abstract class Weapon implements Serializable {
  public static typeName: string = 'Weapon';

  public type: string = Weapon.typeName;
  public rate: number = 1;
  public shotInaccuracy: number = 0.05;
  public shotCount: number = 1;
  public shotSpread: number = Math.PI / 6;
  public damage: number = 0;
  public pierce: number = 1;
  public burstCount: number = 1;
  public burstInterval: number = 0;
  public hitEffect?: AssetIdentifier;

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

  public cleanup() {
    if (this.id !== undefined) {
      EventManager.removeListener('StepEvent', this.id);
    }
  }

  public abstract fire(
    source: Tank,
    angle: number,
    modifier?: HeroModifier
  ): void;

  private async burstFire(
    source: Tank,
    angle: number,
    shotCount: number,
    shotSpread: number,
    modifier?: HeroModifier
  ): Promise<void> {
    const burstCount = this.getBurstCount(modifier);
    for (let i = 0; i < burstCount; i++) {
      // Spread shots out
      const deltaAngle = shotSpread / shotCount;
      const baseAngleOffset = (deltaAngle * (shotCount - 1)) / 2;
      for (let i = 0; i < shotCount; i++) {
        const angleOffset = i * deltaAngle - baseAngleOffset;
        const shotOffset =
          this.shotInaccuracy * RNGManager.nextFloat(-0.5, 0.5);
        this.fire(
          source,
          angle + angleOffset + shotOffset + source.getCannonAngle(),
          modifier
        );
      }
      const event = {
        type: 'FireEvent',
        data: {sourceID: source.id, cannonIndex: source.getCannonIndex()},
      };
      EventManager.emit<FireEvent>(event);
      if (NetworkManager.isServer()) {
        NetworkManager.sendEvent<FireEvent>(event);
      }
      source.incrementCannonIndex();
      if (this.burstInterval > 0) {
        await EventManager.sleep(this.burstInterval);
      }
    }
  }

  protected getRate(modifier?: HeroModifier): number {
    if (!modifier) {
      return this.rate;
    }
    return this.rate / modifier.get('rate');
  }

  protected getShotCount(modifier?: HeroModifier): number {
    if (!modifier) {
      return this.shotCount;
    }
    return modifier.get('shotCount') - 1 + this.shotCount;
  }

  protected getShotSpread(modifier?: HeroModifier): number {
    if (!modifier) {
      return this.shotSpread;
    }
    return modifier.get('shotSpread') * this.shotSpread;
  }

  protected getBurstCount(modifier?: HeroModifier): number {
    if (!modifier) {
      return this.burstCount;
    }
    return modifier.get('burstCount') - 1 + this.burstCount;
  }

  public async fireInternal(
    source: Tank,
    angle: number,
    modifier?: HeroModifier
  ): Promise<void> {
    while (this.cooldown <= 0) {
      const rate = this.getRate(modifier);
      const shotCount = this.getShotCount(modifier);
      const shotSpread = this.getShotSpread(modifier);

      this.cooldown += rate;
      this.burstFire(source, angle, shotCount, shotSpread, modifier);

      await EventManager.sleep(0);
    }
  }

  public serialize(): Data {
    return {
      type: this.type,
      rate: this.rate,
      cooldown: this.cooldown,
      damage: this.damage,
      shotInaccuracy: this.shotInaccuracy,
      shotCount: this.shotCount,
      shotSpread: this.shotSpread,
      pierce: this.pierce,
      burstCount: this.burstCount,
      burstInterval: this.burstInterval,
      hitEffect: this.hitEffect,
    };
  }

  public deserialize(data: Data) {
    const {
      type,
      rate,
      cooldown,
      damage,
      shotInaccuracy,
      shotCount,
      shotSpread,
      pierce,
      burstCount,
      burstInterval,
      hitEffect,
    } = data;

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

    if (typeof shotInaccuracy === 'number') {
      this.shotInaccuracy = shotInaccuracy;
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

    if (typeof burstCount === 'number') {
      this.burstCount = burstCount;
    }

    if (typeof burstInterval === 'number') {
      this.burstInterval = burstInterval;
    }

    if (isAssetIdentifier(hitEffect)) {
      this.hitEffect = hitEffect;
    }
  }

  protected rollDamage(modifier?: HeroModifier): number {
    let {damage} = this;
    if (modifier) {
      damage = modifier.get('damage') * modifier.get('weaponDamage') * damage;
    }
    const roll = RNGManager.nextFloat(-damage / 5, damage / 5);
    return Math.max(1, damage + roll);
  }

  protected onHit(source: Unit, unit?: Unit) {
    if (!(this.hitEffect && unit)) {
      return;
    }

    const effect = EffectManager.instantiate(this.hitEffect);
    if (!effect) {
      return;
    }

    effect.source = source;
    unit.addEffect(effect);
  }
}

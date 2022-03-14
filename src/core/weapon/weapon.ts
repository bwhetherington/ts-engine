import {Serializable, Data} from '@/core/serialize';
import {Tank, Unit} from '@/core/entity';
import {EventManager, StepEvent} from '@/core/event';
import {UUID} from '@/core/uuid';
import {FireEvent} from '@/core/weapon';
import {NetworkManager} from '@/core/net';
import {RNGManager} from '@/core/random';
import {HeroModifier} from '@/core/upgrade';
import {EffectManager} from '@/core/effect';
import {AssetIdentifier, isAssetIdentifier} from '@/core/assets';

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

  protected getShotInaccuracy(tank: Tank): number {
    return (
      this.shotInaccuracy / Math.max(tank.modifiers.get('shotInaccuracy'), 0.05)
    );
  }

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
      for (let j = 0; j < shotCount; j++) {
        const angleOffset = j * deltaAngle - baseAngleOffset;
        const shotOffset =
          this.getShotInaccuracy(source) * RNGManager.nextFloat(-0.5, 0.5);
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
    return this.rate / Math.max(0.1, modifier.get('rate'));
  }

  protected getShotCount(modifier?: HeroModifier): number {
    if (!modifier) {
      return this.shotCount;
    }
    return Math.max(modifier.get('shotCount') - 1 + this.shotCount, 0);
  }

  protected getShotSpread(modifier?: HeroModifier): number {
    if (!modifier) {
      return this.shotSpread;
    }
    return this.shotSpread / Math.max(modifier.get('shotSpread'), 0.05);
  }

  protected getBurstCount(modifier?: HeroModifier): number {
    if (!modifier) {
      return this.burstCount;
    }
    return Math.max(modifier.get('burstCount') - 1 + this.burstCount, 0);
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

  protected getDamage(modifiers: HeroModifier): number {
    return this.damage * modifiers.get('weaponDamage');
  }

  protected onHit(source: Tank, unit?: Unit) {
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

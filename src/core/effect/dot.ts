import {IntervalEffect} from '@/core/effect';
import {Data} from '@/core/serialize';
import {DamageType, Tank} from '@/core/entity';

export class DotEffect extends IntervalEffect {
  public static typeName: string = 'DotEffect';

  public damage: number = 0;
  public inheritWeaponDamage?: boolean = false;

  public override serialize(): Data {
    return {
      ...super.serialize(),
      damage: this.damage,
      inheritWeaponDamage: this.inheritWeaponDamage,
    };
  }

  public override deserialize(data: Data, initialize?: boolean): void {
    super.deserialize(data, initialize);
    const {damage, inheritWeaponDamage} = data;
    if (typeof damage === 'number') {
      this.damage = damage;
    }
    if (typeof inheritWeaponDamage === 'boolean') {
      this.inheritWeaponDamage = inheritWeaponDamage;
    }
  }

  protected override run() {
    let damage = this.damage;
    if (this.source instanceof Tank && this.inheritWeaponDamage) {
      damage *= this.source.modifiers.get('weaponDamage');
    }
    this.target?.damage(damage, DamageType.Energy, this.source);
  }
}

import {IntervalEffect} from '@/core/effect';
import {Data} from '@/core/serialize';

export class DotEffect extends IntervalEffect {
  public static typeName: string = 'DotEffect';

  public damage: number = 0;

  public override serialize(): Data {
    return {
      ...super.serialize(),
      damage: this.damage,
    };
  }

  public override deserialize(data: Data, initialize?: boolean): void {
    super.deserialize(data, initialize);
    const {damage} = data;
    if (typeof damage === 'number') {
      this.damage = damage;
    }
  }

  protected override run() {
    this.target?.damage(this.damage, this.source);
  }
}

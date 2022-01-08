import {Tank} from 'core/entity';
import {Data} from 'core/serialize';
import {HeroModifier} from 'core/upgrade';
import {Effect} from '.';

export class ModifierEffect extends Effect {
  public static typeName: string = 'ModifierEffect';

  public modifiers: HeroModifier = new HeroModifier();

  public override serialize(): Data {
    return {
      ...super.serialize(),
      modifiers: this.modifiers.serialize(),
    };
  }

  public override deserialize(data: Data, initialize?: boolean) {
    super.deserialize(data, initialize);
    if (data.modifiers) {
      this.modifiers.deserialize(data.modifiers);
    }
  }

  protected override onStart() {
    if (this.target instanceof Tank) {
      this.target.modifiers.compose(this.modifiers);
    }
  }

  protected override onEnd() {
    if (this.target instanceof Tank) {
      this.target.modifiers.compose(this.modifiers, true);
    }
  }
}

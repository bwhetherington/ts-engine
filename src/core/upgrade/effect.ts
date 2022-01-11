import { AssetIdentifier, isAssetIdentifier } from 'core/assets';
import { EffectManager } from 'core/effect';
import {Aura, BaseHero, WorldManager} from 'core/entity';
import {Data} from 'core/serialize';
import {Upgrade} from 'core/upgrade';

export class EffectUpgrade extends Upgrade {
  public static typeName: string = 'EffectUpgrade';

  private effect?: AssetIdentifier;

  public applyTo(hero: BaseHero) {
    if (!this.effect) {
      return;
    }
    const effect = EffectManager.instantiate(this.effect);

    if (!effect) {
      return;
    }

    effect.source = hero;
    hero.addEffect(effect);
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      effect: this.effect,
    };
  }

  public override deserialize(data: Data) {
    super.deserialize(data);
    const {effect} = data;
    if (isAssetIdentifier(effect)) {
      this.effect = effect;
    }
  }
}

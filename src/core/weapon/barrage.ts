
import {BaseGun} from 'core/weapon';
import {HeroModifier} from 'core/upgrade';

export class BaseBarrageGun extends BaseGun {
  public static typeName: string = 'BaseBarrageGun';

  protected getRate(modifier?: HeroModifier): number {
    const multiplier =
      super.getBurstCount(modifier) * super.getShotCount(modifier);
    return super.getRate(modifier) / multiplier;
  }

  protected getShotCount(_modifier?: HeroModifier): number {
    return 1;
  }

  protected getShotSpread(_modifier?: HeroModifier): number {
    return 0;
  }

  protected getBurstCount(_modifier?: HeroModifier): number {
    return 1;
  }
}

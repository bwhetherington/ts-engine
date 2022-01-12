import {BaseHero} from '@/core/entity';
import {Data} from '@/core/serialize';
import {Upgrade} from '@/core/upgrade';

export class ClassUpgrade extends Upgrade {
  public static typeName: string = 'ClassUpgrade';

  public className: string = 'Hero';
  public tier: number = 0;

  constructor(className?: string) {
    super();
    if (className) {
      this.className = className;
    }
  }

  public applyTo(hero: BaseHero) {
    hero.upgrades.push(this.type);

    const player = hero.getPlayer();
    if (!player) {
      return;
    }

    player.setClass(this.className);
    if (!player.hero) {
      return;
    }

    player.hero.classTier = this.tier;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      className: this.className,
      tier: this.tier,
    };
  }

  public deserialize(data: Data) {
    super.deserialize(data);
    const {className, tier} = data;
    if (typeof className === 'string') {
      this.className = className;
    }
    if (typeof tier === 'number') {
      this.tier = tier;
    }
  }
}

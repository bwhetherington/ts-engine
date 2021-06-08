import {BaseHero} from 'core/entity';
import {Data} from 'core/serialize';
import {Upgrade} from 'core/upgrade';

export class ClassUpgrade extends Upgrade {
  public static typeName: string = 'ClassUpgrade';

  private className: string = 'Hero';

  constructor(className?: string) {
    super();
    if (className) {
      this.className = className;
    }
  }

  public applyTo(hero: BaseHero): void {
    hero.getPlayer()?.setClass?.(this.className);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      className: this.className,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {className} = data;
    if (typeof className === 'string') {
      this.className = className;
    }
  }
}

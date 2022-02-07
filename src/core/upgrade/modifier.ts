import {Data, Serializable} from '@/core/serialize';
import {Upgrade} from '@/core/upgrade';
import {BaseHero} from '@/core/entity';
import {Iterator} from '@/core/iterator';

type Modifiers = Record<string, number>;

export const MODIFIER_KEYS = [
  'life',
  'lifeRegen',
  'lifeRegenDelay',
  'speed',
  'friction',
  'mass',
  'armor',
  'damage',
  'weaponDamage',
  'pierce',
  'rate',
  'shotCount',
  'shotSpread',
  'shotInaccuracy',
  'burstCount',
  'projectileSpeed',
  'projectileDuration',
  'projectileSpread',
  // New ones
  'reflection',
  'absorption',
  'lifeSteal',
];

export class HeroModifier implements Serializable {
  public modifiers: Modifiers;

  constructor(modifiers?: Modifiers) {
    this.modifiers = modifiers ?? {};
  }

  public serialize(): Data {
    return Iterator.entries(this.modifiers).fold(
      {} as Data,
      (data, [key, value]) => {
        data[key] = value;
        return data;
      }
    );
  }

  public deserialize(data: Data) {
    Iterator.array(MODIFIER_KEYS)
      .map((key) => [key, data[key]])
      .filter(([_, value]) => typeof value === 'number')
      .forEach(([key, value]) => {
        this.modifiers[key] = value;
      });
  }

  public has(key: string): boolean {
    return this.modifiers.hasOwnProperty(key);
  }

  public get(key: string): number {
    return this.modifiers[key] ?? 1;
  }

  public set(key: string, value: number) {
    this.modifiers[key] = value;
  }

  private composeKey(key: string, other: Modifiers, invert: boolean = false) {
    let existing = this.modifiers[key] ?? 1;
    const target = other[key];
    if (target) {
      if (invert) {
        existing = existing - target;
      } else {
        existing = existing + target;
      }
    }
    this.modifiers[key] = existing;
  }

  public compose(other: HeroModifier, invert: boolean = false) {
    this.composeModifiers(other.modifiers, invert);
  }

  public composeModifiers(other: Modifiers, invert: boolean = false) {
    Iterator.array(MODIFIER_KEYS)
      .filter(
        (key) => this.modifiers.hasOwnProperty(key) || other.hasOwnProperty(key)
      )
      .forEach((key) => {
        this.composeKey(key, other, invert);
      });
  }
}

export class ModifierUpgrade extends Upgrade {
  public static typeName: string = 'ModifierUpgrade';

  public modifiers: HeroModifier = new HeroModifier();

  constructor(modifiers?: Modifiers) {
    super();
    if (modifiers) {
      this.modifiers.composeModifiers(modifiers);
    }
  }

  public applyTo(hero: BaseHero) {
    hero.composeModifiers(this.modifiers);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      modifiers: this.modifiers?.serialize(),
    };
  }

  public deserialize(data: Data) {
    super.deserialize(data);
    const {modifiers} = data;
    this.modifiers.deserialize(modifiers);
  }
}

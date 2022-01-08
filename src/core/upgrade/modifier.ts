import {Data, Serializable} from 'core/serialize';
import {Matrix2} from 'core/geometry';
import {Upgrade} from 'core/upgrade';
import {BaseHero} from 'core/entity';
import {Iterator} from 'core/iterator';

type Modifiers = Record<string, number>;

const MODIFIER_KEYS = [
  'life',
  'lifeRegen',
  'speed',
  'armor',
  'damage',
  'weaponDamage',
  'pierce',
  'rate',
  'shotCount',
  'shotSpread',
  'burstCount',
  'projectileSpeed',
  'projectileDuration',
  'projectileSpread',
];

const IDENTITY = new Matrix2().identity();

export class HeroModifier implements Serializable {
  public modifiers: Modifiers = {};

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
    const mod = this.modifiers[key];
    if (!mod) {
      return 1;
    }
    return mod;
  }

  private composeKey(key: string, other: Modifiers, invert: boolean = false) {
    let existing = this.modifiers[key];
    if (!existing) {
      existing = 1;
    }
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

  private modifiers: HeroModifier = new HeroModifier();

  constructor(modifiers?: Modifiers) {
    super();
    if (modifiers) {
      this.modifiers.composeModifiers(modifiers);
    }
  }

  public applyTo(hero: BaseHero) {
    hero.modifiers.compose(this.modifiers);
    if (this.modifiers.has('life')) {
      hero.updateMaxLife();
    }
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      modifiers: this.modifiers?.serialize?.(),
    };
  }

  public deserialize(data: Data) {
    super.deserialize(data);
    const {modifiers} = data;
    this.modifiers.deserialize(modifiers);
  }
}

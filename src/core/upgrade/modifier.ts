import {Data, Serializable} from 'core/serialize';
import {Matrix2} from 'core/geometry';
import {Upgrade} from 'core/upgrade';
import {BaseHero} from 'core/entity';
import {Iterator} from 'core/iterator';

type Modifiers = Record<string, Matrix2>;

const MODIFIER_KEYS = [
  'life',
  'armor',
  'damage',
  'pierce',
  'rate',
  'shotCount',
  'shotSpread',
  'burstCount',
  'projectileSpeed',
  'projectileDuration',
  'projectileSpread',
];

export class HeroModifier implements Serializable {
  public modifiers: Modifiers = {};

  public serialize(): Data {
    return Iterator.entries(this.modifiers).fold(
      {} as Data,
      (data, [key, value]) => {
        data[key] = value.serialize();
        return data;
      }
    );
  }

  public deserialize(data: Data) {
    Iterator.array(MODIFIER_KEYS)
      .map((key) => [key, data[key]])
      .filter(([_, value]) => value !== undefined)
      .forEach(([key, value]) => {
        let mod = this.modifiers[key];
        if (!mod) {
          mod = new Matrix2().identity();
          this.modifiers[key] = mod;
        }
        mod.deserialize(value);
      });
  }

  public has(key: string): boolean {
    return this.modifiers.hasOwnProperty(key);
  }

  public get(key: string): Matrix2 {
    let mod = this.modifiers[key];
    if (!mod) {
      mod = new Matrix2().identity();
      this.modifiers[key] = mod;
    }
    return mod;
  }

  private multiplyKey(key: string, other: Modifiers, invert: boolean = false) {
    let existing = this.modifiers[key];
    if (!existing) {
      existing = new Matrix2().identity();
    }
    const target = other[key];
    if (target) {
      if (invert) {
        existing = existing.multiplyInverse(target);
      } else {
        existing = existing.multiply(target);
      }
    }
    this.modifiers[key] = existing;
  }

  public multiply(other: HeroModifier, invert: boolean = false) {
    this.multiplyModifiers(other.modifiers, invert);
  }

  public multiplyModifiers(other: Modifiers, invert: boolean = false) {
    Iterator.array(MODIFIER_KEYS)
      .filter(
        (key) => this.modifiers.hasOwnProperty(key) || other.hasOwnProperty(key)
      )
      .forEach((key) => {
        this.multiplyKey(key, other, invert);
      });
  }
}

export class ModifierUpgrade extends Upgrade {
  public static typeName: string = 'ModifierUpgrade';

  private modifiers: HeroModifier = new HeroModifier();

  constructor(modifiers?: Modifiers) {
    super();
    if (modifiers) {
      this.modifiers.multiplyModifiers(modifiers);
    }
  }

  public applyTo(hero: BaseHero) {
    hero.modifiers.multiply(this.modifiers);
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

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

  public deserialize(data: Data): void {
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

  public get(key: string): Matrix2 {
    let mod = this.modifiers[key];
    if (!mod) {
      mod = new Matrix2().identity();
      this.modifiers[key] = mod;
    }
    return mod;
  }

  private multiplyKey(key: string, other: Modifiers): void {
    let existing = this.modifiers[key];
    if (!existing) {
      existing = new Matrix2().identity();
    }
    const target = other[key];
    if (target) {
      existing = existing.multiply(target);
    }
    this.modifiers[key] = existing;
  }

  public multiply(other: HeroModifier): void {
    this.multiplyModifiers(other.modifiers);
  }

  public multiplyModifiers(other: Modifiers): void {
    Iterator.array(MODIFIER_KEYS)
      .filter(
        (key) => this.modifiers.hasOwnProperty(key) || other.hasOwnProperty(key)
      )
      .forEach((key) => {
        this.multiplyKey(key, other);
      });
  }
}

export class ModifierUpgrade extends Upgrade {
  private modifiers: HeroModifier = new HeroModifier();

  public constructor(modifiers: Modifiers) {
    super();
    this.modifiers.multiplyModifiers(modifiers);
  }

  public applyTo(hero: BaseHero): void {
    hero.modifiers.multiply(this.modifiers);
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      modifiers: this.modifiers?.serialize?.(),
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);
    const {modifiers} = data;
    this.modifiers.deserialize(modifiers);
  }
}

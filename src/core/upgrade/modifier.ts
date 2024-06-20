import {Data, Serializable} from '@/core/serialize';
import {Upgrade} from '@/core/upgrade';
import {BaseHero} from '@/core/entity';
import {Iterator} from '@/core/iterator';
import {LogManager} from '@/core/log';

const log = LogManager.forFile(__filename);

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

type Composition = (previous: number, amount: number) => number;

const multiplicativeComposition: Composition = (previous, amount) => {
  return previous * (1 + amount);
};

const inverseMultiplicativeComposition: Composition = (previous, amount) => {
  return previous * (1 - amount);
};

const additiveComposition: Composition = (previous, amount) => {
  return previous + amount;
};

interface KeyInfo {
  composition: Composition;
  default: number;
}

const multiplicative: KeyInfo = {
  composition: multiplicativeComposition,
  default: 1,
};

const additive: KeyInfo = {
  composition: additiveComposition,
  default: 0,
};

const KEY_COMPOSE_MAP = new Map<string, KeyInfo>([
  ['life', multiplicative],
  ['lifeRegen', multiplicative],
  ['lifeRegenDelay', multiplicative],
  ['speed', multiplicative],
  ['friction', multiplicative],
  ['mass', multiplicative],
  ['armor', additive],
  ['damage', multiplicative],
  ['weaponDamage', multiplicative],
  ['pierce', additive],
  ['rate', {composition: inverseMultiplicativeComposition, default: 1}],
  ['shotCount', additive],
  ['shotSpread', multiplicative],
  ['shotInaccuracy', multiplicative],
  ['burstCount', additive],
  ['projectileSpeed', multiplicative],
  ['projectileDuration', multiplicative],
  ['projectileSpread', multiplicative],
  ['reflection', multiplicative],
  ['absorption', {composition: inverseMultiplicativeComposition, default: 1}],
  ['lifeSteal', multiplicative],
]);

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

  public equals(other: HeroModifier): boolean {
    const aEntries = Iterator.entries(this.modifiers).toArray();
    const bCount = Iterator.entries(other.modifiers).count();

    if (aEntries.length !== bCount) {
      return false;
    }

    for (const [aKey, aValue] of aEntries) {
      const bValue = other.get(aKey);
      if (bValue !== aValue) {
        return false;
      }
    }

    return true;
  }

  public has(key: string): boolean {
    return this.modifiers.hasOwnProperty(key);
  }

  public get(key: string): number {
    return this.modifiers[key] ?? KEY_COMPOSE_MAP.get(key)?.default ?? 0;
  }

  public set(key: string, value: number) {
    this.modifiers[key] = value;
  }

  public reset() {
    this.modifiers = {};
  }

  private composeKey(key: string, target: number) {
    const info = KEY_COMPOSE_MAP.get(key);
    if (!info) {
      log.warn('unknown key: ' + key);
      return;
    }
    const existing = this.get(key);
    const newValue = info.composition(existing, target);
    this.modifiers[key] = newValue;
  }

  public compose(other: HeroModifier) {
    this.composeModifiers(other.modifiers);
  }

  public composeModifiers(other: Modifiers) {
    Iterator.entries(other).forEach(([key, value]) =>
      this.composeKey(key, value)
    );
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
    hero.addModifiers(this.modifiers);
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

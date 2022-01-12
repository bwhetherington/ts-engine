import {Rectangle, Vector} from '@/core/geometry';
import {Iterator} from '@/core/iterator';

export interface RNG {
  seed(seed: number): void;
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  nextBoolean(chance: number): boolean;
  iterator(): Iterator<number>;
  ints(min: number, max: number): Iterator<number>;
  floats(min: number, max: number): Iterator<number>;
}

function toIntRange(min: number, max: number, num: number): number {
  return Math.floor(num * (max - min) + min);
}

export abstract class AbstractRNG implements RNG {
  public abstract next(): number;
  public abstract seed(seed: number): void;

  public nextFloat(min: number = 0, max: number = 1): number {
    return this.next() * (max - min) + min;
  }

  public nextVector(bounds: Rectangle): Vector {
    const x = this.nextFloat(bounds.x, bounds.farX);
    const y = this.nextFloat(bounds.y, bounds.farY);
    return new Vector(x, y);
  }

  public nextInt(min: number, max: number): number {
    return toIntRange(min, max, this.next());
  }

  public nextBoolean(chance: number): boolean {
    return this.next() < chance;
  }

  public nextEntry<T>(entries: T[]): T {
    const index = this.nextInt(0, entries.length);
    return entries[index];
  }

  private *iteratorInternal(): Iterable<number> {
    while (true) {
      yield this.next();
    }
  }

  public iterator(): Iterator<number> {
    return Iterator.from(this.iteratorInternal());
  }

  public ints(min: number, max: number): Iterator<number> {
    return this.iterator().map(toIntRange.bind(null, min, max));
  }

  public floats(min: number, max: number): Iterator<number> {
    return this.iterator().map((num) => num * (max - min) + min);
  }

  public sample<T>(source: T[], useReplacement?: boolean): Iterator<T> {
    let isValid: (index: number) => boolean;
    if (!useReplacement) {
      const selectedIndices = new Set();
      isValid = (index) => {
        const allow = !selectedIndices.has(index);
        if (allow) {
          selectedIndices.add(index);
        }
        return allow;
      };
    } else {
      isValid = () => true;
    }
    return this.ints(0, source.length)
      .filter(isValid)
      .map((i) => source[i]);
  }
}

export * from '@/core/random/basic';
import {RNGManager} from '@/core/random/manager';

const RM = new RNGManager();
export {RM as RNGManager};

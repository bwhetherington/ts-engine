import { iterator, Iterator } from 'core/iterator';

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

function toIntRange(min: number, max: number, number: number): number {
  return Math.floor(number * (max - min) + min);
}

export abstract class AbstractRNG implements RNG {
  public abstract next(): number;
  public abstract seed(seed: number): void;

  public nextFloat(min: number = 0, max: number = 1): number {
    return this.next() * (max - min) + min;
  }

  public nextInt(min: number, max: number): number {
    return toIntRange(min, max, this.next());
  }

  public nextBoolean(chance: number): boolean {
    return this.next() < chance;
  }

  private *iteratorInternal(): Generator<number> {
    while (true) {
      yield this.next();
    }
  }

  public iterator(): Iterator<number> {
    return iterator(this.iteratorInternal());
  }

  public ints(min: number, max: number): Iterator<number> {
    return this.iterator().map(toIntRange.bind(null, min, max));
  }

  public floats(min: number, max: number): Iterator<number> {
    return this.iterator().map((num) => num * (max - min) + min);
  }
}

export * from 'core/random/basic';
import { RNGManager } from 'core/random/manager';

const RM = new RNGManager();
export { RM as RNGManager };

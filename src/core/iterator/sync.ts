function* map<T, U>(gen: Generator<T>, fn: (x: T) => U): Generator<U> {
  for (const x of gen) {
    yield fn(x);
  }
}

function* flatMap<T, U>(
  gen: Generator<T>,
  fn: (x: T) => Generator<U>
): Generator<U> {
  for (const x of gen) {
    yield* fn(x);
  }
}

function* filter<T>(gen: Generator<T>, fn: (x: T) => boolean): Generator<T> {
  for (const x of gen) {
    if (fn(x)) {
      yield x;
    }
  }
}

function* take<T>(gen: Generator<T>, num: number): Generator<T> {
  let i = 0;
  for (const x of gen) {
    if (i < num) {
      yield x;
      i += 1;
    } else {
      break;
    }
  }
}

function* takeWhile<T>(gen: Generator<T>, fn: (x: T) => boolean): Generator<T> {
  for (const x of gen) {
    if (fn(x)) {
      yield x;
    } else {
      break;
    }
  }
}

function* skip<T>(gen: Generator<T>, num: number): Generator<T> {
  let i = 0;
  for (const x of gen) {
    if (i >= num) {
      yield x;
    }
    i += 1;
  }
}

function* skipWhile<T>(gen: Generator<T>, fn: (x: T) => boolean): Generator<T> {
  let conditionMet = false;
  for (const x of gen) {
    if (conditionMet || fn(x)) {
      yield x;
      conditionMet = true;
    }
  }
}

function* use<T>(gen: Generator<T>, fn: (x: T) => void): Generator<T> {
  for (const x of gen) {
    fn(x);
    yield x;
  }
}

export interface IterableObject<T> {
  [key: string]: T;
}

function* iterateObjectInternal<T>(obj: IterableObject<T>): Generator<T> {
  for (const key in obj) {
    yield obj[key];
  }
}

function* iterateArray<T>(array: T[]): Generator<T> {
  for (let i = 0; i < array.length; i++) {
    yield array[i];
  }
}

export function iterateObject<T>(obj: IterableObject<T>): Iterator<T> {
  return iterator(iterateObjectInternal(obj));
}

export function iterator<T>(gen: Iterable<T>): Iterator<T> {
  return new Iterator(gen);
}

type Iterable<T> = T[] | Generator<T>;

export class Iterator<T> implements Generator<T> {
  private generator: Generator<T>;

  constructor(generator: Iterable<T>) {
    if (generator instanceof Array) {
      this.generator = iterateArray(generator);
    } else {
      this.generator = generator;
    }
  }

  public next(): IteratorResult<T, any> {
    return this.generator.next();
  }

  public return(x: any): any {
    return this.generator.return(x);
  }

  public throw(x: any): any {
    return this.generator.throw(x);
  }

  public [Symbol.iterator](): Generator<T> {
    return this.generator;
  }

  public map<U>(fn: (x: T) => U): Iterator<U> {
    return iterator(map(this.generator, fn));
  }

  public flatMap<U>(fn: (x: T) => Generator<U>): Iterator<U> {
    return iterator(flatMap(this.generator, fn));
  }

  public filter(fn: (x: T) => boolean): Iterator<T> {
    return iterator(filter(this.generator, fn));
  }

  public fold<U>(initial: U, fn: (acc: U, x: T) => U): U {
    let output = initial;
    for (const x of this.generator) {
      output = fn(output, x);
    }
    return output;
  }

  public take(amount: number): Iterator<T> {
    return iterator(take(this.generator, amount));
  }

  public takeWhile(fn: (x: T) => boolean): Iterator<T> {
    return iterator(takeWhile(this.generator, fn));
  }

  public skip(amount: number): Iterator<T> {
    return iterator(skip(this.generator, amount));
  }

  public skipWhile(fn: (x: T) => boolean): Iterator<T> {
    return iterator(skipWhile(this.generator, fn));
  }

  public use(fn: (x: T) => void): Iterator<T> {
    return iterator(use(this.generator, fn));
  }

  public forEach(fn: (x: T) => void): void {
    for (const x of this.generator) {
      fn(x);
    }
  }

  public toArray(): Array<T> {
    const arr = [];
    for (const x of this.generator) {
      arr.push(x);
    }
    return arr;
  }

  public any(fn: (x: T) => boolean): boolean {
    for (const x of this.generator) {
      if (fn(x)) {
        return true;
      }
    }
    return false;
  }

  public all(fn: (x: T) => boolean): boolean {
    return !this.any((x) => !fn(x));
  }
}

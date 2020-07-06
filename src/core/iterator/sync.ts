function* map<T, U>(gen: Generator<T>, fn: (x: T) => U): Generator<U> {
  for (const x of gen) {
    yield fn(x);
  }
}

function* flatMap<T, U>(gen: Generator<T>, fn: (x: T) => Generator<U>): Generator<U> {
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

export interface IterableObject<T> {
  [key: string]: T;
}

function* iterateObjectInternal<T>(obj: IterableObject<T>): Generator<T> {
  for (const key in obj) {
    yield obj[key];
  }
}

export function iterateObject<T>(obj: IterableObject<T>): Iterator<T> {
  return iterator(iterateObjectInternal(obj));
}

export function iterator<T>(gen: Generator<T>): Iterator<T> {
  return new Iterator(gen);
}

export class Iterator<T> implements Generator<T> {
  private generator: Generator<T>;

  constructor(generator: Generator<T>) {
    this.generator = generator;
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
}
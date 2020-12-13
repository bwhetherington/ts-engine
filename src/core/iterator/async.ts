async function* map<T, U>(gen: AsyncGenerator<T>, fn: (x: T) => Promise<U>): AsyncGenerator<U> {
  for await (const x of gen) {
    yield await fn(x);
  }
}

async function* flatMap<T, U>(
  gen: AsyncGenerator<T>,
  fn: (x: T) => AsyncGenerator<U>
): AsyncGenerator<U> {
  for await (const x of gen) {
    yield* fn(x);
  }
}

async function* filter<T>(gen: AsyncGenerator<T>, fn: (x: T) => Promise<boolean>): AsyncGenerator<T> {
  for await (const x of gen) {
    if (await fn(x)) {
      yield x;
    }
  }
}

async function* filterType<T, U extends T>(
  gen: AsyncGenerator<T>,
  typeCheck: (x: T) => x is U
): AsyncGenerator<U> {
  for await (const x of gen) {
    if (typeCheck(x)) {
      yield x;
    }
  }
}

async function* filterMap<T, U>(
  gen: AsyncGenerator<T>,
  fn: (x: T) => Promise<U | undefined>
): AsyncGenerator<U> {
  for await (const x of gen) {
    const y = await fn(x);
    if (y !== undefined) {
      yield y;
    }
  }
}

async function* take<T>(gen: AsyncGenerator<T>, num: number): AsyncGenerator<T> {
  let i = 0;
  for await (const x of gen) {
    if (i < num) {
      yield x;
      i += 1;
    } else {
      break;
    }
  }
}

async function* takeWhile<T>(gen: AsyncGenerator<T>, fn: (x: T) => Promise<boolean>): AsyncGenerator<T> {
  for await (const x of gen) {
    if (await fn(x)) {
      yield x;
    } else {
      break;
    }
  }
}

async function* skip<T>(gen: AsyncGenerator<T>, num: number): AsyncGenerator<T> {
  let i = 0;
  for await (const x of gen) {
    if (i >= num) {
      yield x;
    }
    i += 1;
  }
}

async function* skipWhile<T>(gen: AsyncGenerator<T>, fn: (x: T) => Promise<boolean>): AsyncGenerator<T> {
  let conditionMet = false;
  for await (const x of gen) {
    if (conditionMet || await fn(x)) {
      yield x;
      conditionMet = true;
    }
  }
}

async function* use<T>(gen: AsyncGenerator<T>, fn: (x: T) => Promise<void>): AsyncGenerator<T> {
  for await (const x of gen) {
    await fn(x);
    yield x;
  }
}

async function* enumerate<T>(gen: AsyncGenerator<T>): AsyncGenerator<[T, number]> {
  let i = 0;
  for await (const element of gen) {
    yield [element, i];
    i += 1;
  }
}

class IteratorBuilder<T> {
  private yieldQueue: T[] = [];
  private resolver = () => {};
  private guard: Promise<void> = new Promise((resolve) => {
    this.resolver = resolve;
  });

  public static build<T>(body: ($yield: (arg: T) => void) => void): IteratorBuilder<T> {
    const builder = new IteratorBuilder<T>();
    const $yield = (arg: T) => {
      builder.yieldQueue.push(arg);
      builder.resolver();
      builder.guard = new Promise((resolve) => {
        builder.resolver = resolve;
      });
    };
    body($yield);
    return builder;
  }

  public async *toGenerator(): AsyncGenerator<T> {
    while (true) {
      for (const val of this.yieldQueue) {
        yield val;
      }
      this.yieldQueue = [];

      // Wait until we get a new item
      await this.guard;
    }
  }
}

export class AsyncIterator<T> {
  private generator: AsyncGenerator<T>;

  constructor(generator: AsyncGenerator<T>) {
    this.generator = generator;
  }

  public static generator<T>(generator: AsyncGenerator<T>): AsyncIterator<T> {
    return new AsyncIterator(generator);
  }

  public static from<T>(body: ($yield: (arg: T) => void) => void): AsyncIterator<T> {
    const builder = IteratorBuilder.build(body);
    return AsyncIterator.generator(builder.toGenerator());
  }

  public [Symbol.asyncIterator](): AsyncGenerator<T> {
    return this.generator;
  }

  public enumerate(): AsyncIterator<[T, number]> {
    return AsyncIterator.generator(enumerate(this.generator));
  }

  public map<U>(fn: (x: T) => Promise<U>): AsyncIterator<U> {
    return AsyncIterator.generator(map(this.generator, fn));
  }

  public flatMap<U>(fn: (x: T) => AsyncGenerator<U>): AsyncIterator<U> {
    return AsyncIterator.generator(flatMap(this.generator, fn));
  }

  public filter(fn: (x: T) => Promise<boolean>): AsyncIterator<T> {
    return AsyncIterator.generator(filter(this.generator, fn));
  }

  public filterType<U extends T>(fn: (x: T) => x is U): AsyncIterator<U> {
    return AsyncIterator.generator(filterType(this.generator, fn));
  }

  public filterMap<U>(fn: (x: T) => Promise<U | undefined>): AsyncIterator<U> {
    return AsyncIterator.generator(filterMap(this.generator, fn));
  }

  public async fold<U>(initial: U, fn: (acc: U, x: T) => Promise<U>): Promise<U> {
    let output = initial;
    for await (const x of this.generator) {
      output = await fn(output, x);
    }
    return output;
  }

  /**
   * Produces a new iterator which yields some number of elements from the
   * beginning of this iterator.
   * @param amount The number of elements to take
   */
  public take(amount: number): AsyncIterator<T> {
    return AsyncIterator.generator(take(this.generator, amount));
  }

  /**
   * Produces a new iterator which yields values until one does not satisfy
   * the given predicate. The first value not to satisfy the given predicate is
   * not included in the new iterator.
   * @param fn A predicate function
   */
  public takeWhile(fn: (x: T) => Promise<boolean>): AsyncIterator<T> {
    return AsyncIterator.generator(takeWhile(this.generator, fn));
  }

  /**
   * Produces a new iterator which ignores some number of elements at the
   * beginning.
   * @param amount The number of elements to skip
   */
  public skip(amount: number): AsyncIterator<T> {
    return AsyncIterator.generator(skip(this.generator, amount));
  }

  /**
   * Produces a new iterator which ignores elements of this iterator while a
   * given predicate holds. The first element of the new iterator will be the
   * first element which does not satisfy the given predicate.
   * @param fn A predicate function
   */
  public skipWhile(fn: (x: T) => Promise<boolean>): AsyncIterator<T> {
    return AsyncIterator.generator(skipWhile(this.generator, fn));
  }

  /**
   * Produces a new iterator which executes the specified function on each
   * element before yielding it.
   * @param fn A function
   */
  public use(fn: (x: T) => Promise<void>): AsyncIterator<T> {
    return AsyncIterator.generator(use(this.generator, fn));
  }

  /**
   * Executes the specified function once on each element of this iterator.
   * @param fn A function
   */
  public async forEach(fn: (x: T) => Promise<void>): Promise<void> {
    for await (const x of this.generator) {
      await fn(x);
    }
  }

  /**
   * Produces an array containing all elements of this iterator.
   */
  public async toArray(): Promise<T[]> {
    const arr = [];
    for await (const x of this.generator) {
      arr.push(x);
    }
    return arr;
  }

  /**
   * Determines whether at least one element of this iterator satisfies the
   * given predicate.
   * @param fn A predicate function
   */
  public async any(fn: (x: T) => Promise<boolean>): Promise<boolean> {
    return !!await this.find(fn);
  }

  /**
   * Determines whether every element of this iterator satisfies the given
   * predicate.
   * @param fn A predicate function
   */
  public async  all(fn: (x: T) => Promise<boolean>): Promise<boolean> {
    return !await this.any(async (x) => !await fn(x));
  }

  /**
   * Produces the first element of this iterator that satisfies the given predicate.
   * @param fn A predicate function
   */
  public find(fn: (x: T) => Promise<boolean>): Promise<T | undefined> {
    return this.filter(fn).first();
  }

  public async first(): Promise<T | undefined> {
    for await (const x of this.generator) {
      return x;
    }
  }
}

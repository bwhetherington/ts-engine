type MaybePromise<T> = T | Promise<T>;

async function* map<T, U>(
  gen: AsyncIterable<T>,
  fn: (x: T) => MaybePromise<U>
): AsyncIterable<U> {
  for await (const x of gen) {
    yield await fn(x);
  }
}

async function* flatMap<T, U>(
  gen: AsyncIterable<T>,
  fn: (x: T) => AsyncIterable<U>
): AsyncIterable<U> {
  for await (const x of gen) {
    yield* fn(x);
  }
}

async function* filter<T>(
  gen: AsyncIterable<T>,
  fn: (x: T) => MaybePromise<boolean>
): AsyncIterable<T> {
  for await (const x of gen) {
    if (await fn(x)) {
      yield x;
    }
  }
}

async function* filterType<T, U extends T>(
  gen: AsyncIterable<T>,
  typeCheck: (x: T) => x is U
): AsyncIterable<U> {
  for await (const x of gen) {
    if (typeCheck(x)) {
      yield x;
    }
  }
}

async function* filterMap<T, U>(
  gen: AsyncIterable<T>,
  fn: (x: T) => MaybePromise<U | undefined>
): AsyncIterable<U> {
  for await (const x of gen) {
    const y = await fn(x);
    if (y !== undefined) {
      yield y;
    }
  }
}

async function* take<T>(gen: AsyncIterable<T>, num: number): AsyncIterable<T> {
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

async function* takeWhile<T>(
  gen: AsyncIterable<T>,
  fn: (x: T) => MaybePromise<boolean>
): AsyncIterable<T> {
  for await (const x of gen) {
    if (await fn(x)) {
      yield x;
    } else {
      break;
    }
  }
}

async function* skip<T>(gen: AsyncIterable<T>, num: number): AsyncIterable<T> {
  let i = 0;
  for await (const x of gen) {
    if (i >= num) {
      yield x;
    }
    i += 1;
  }
}

async function* skipWhile<T>(
  gen: AsyncIterable<T>,
  fn: (x: T) => MaybePromise<boolean>
): AsyncIterable<T> {
  let conditionMet = false;
  for await (const x of gen) {
    if (conditionMet || (await fn(x))) {
      yield x;
      conditionMet = true;
    }
  }
}

async function* use<T>(
  gen: AsyncIterable<T>,
  fn: (x: T) => MaybePromise<void>
): AsyncIterable<T> {
  for await (const x of gen) {
    await fn(x);
    yield x;
  }
}

async function* enumerate<T>(
  gen: AsyncIterable<T>
): AsyncIterable<[T, number]> {
  let i = 0;
  for await (const element of gen) {
    yield [element, i];
    i += 1;
  }
}

interface IteratorFunctions<T> {
  $yield(arg: T): void;
  $yieldAll(args: Iterable<T>): void;
}

function buildIterator<T>(
  body: (fns: IteratorFunctions<T>) => void
): AsyncIterable<T> {
  let yieldQueue: T[] = [];
  let resolver = (_?: void) => {};
  let guard = new Promise((resolve) => (resolver = resolve));

  const $yield = (arg: T) => {
    yieldQueue.push(arg);
    resolver();
    guard = new Promise((resolve) => (resolver = resolve));
  };

  const $yieldAll = (iterable: Iterable<T>) => {
    for (const x of iterable) {
      $yield(x);
    }
  };

  body({$yield, $yieldAll});

  return (async function* () {
    while (true) {
      for (const val of yieldQueue) {
        yield val;
      }
      yieldQueue = [];
      await guard;
    }
  })();
}

class IteratorBuilder<T> {
  private isDone: boolean = false;
  private yieldQueue: T[] = [];
  private resolver = () => {};
  private guard: MaybePromise<void> = new Promise((resolve) => {
    this.resolver = resolve;
  });

  public static build<T>(
    body: (fns: IteratorFunctions<T>) => void
  ): IteratorBuilder<T> {
    const builder = new IteratorBuilder<T>();
    const $yield = (arg: T) => {
      builder.yieldQueue.push(arg);
      builder.resolver();
      builder.guard = new Promise((resolve) => {
        builder.resolver = resolve;
      });
    };
    const $yieldAll = (iterable: Iterable<T>) => {
      for (const x of iterable) {
        $yield(x);
      }
    };
    const fns = {$yield, $yieldAll};
    body(fns);
    return builder;
  }

  public async *toGenerator(): AsyncIterable<T> {
    while (!this.isDone) {
      for (const val of this.yieldQueue) {
        yield val;
      }
      this.yieldQueue = [];

      // Wait until we get a new item
      await this.guard;
    }
  }
}

export class AsyncIterator<T> implements AsyncIterable<T> {
  private generator: AsyncIterable<T>;

  constructor(generator: AsyncIterable<T>) {
    this.generator = generator;
  }

  public static generator<T>(generator: AsyncIterable<T>): AsyncIterator<T> {
    return new AsyncIterator(generator);
  }

  public static from<T>(
    body: (fns: IteratorFunctions<T>) => void
  ): AsyncIterator<T> {
    return AsyncIterator.generator(buildIterator(body));
  }

  public async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    for await (const x of this.generator) {
      yield x;
    }
  }

  public enumerate(): AsyncIterator<[T, number]> {
    return AsyncIterator.generator(enumerate(this.generator));
  }

  public map<U>(fn: (x: T) => MaybePromise<U>): AsyncIterator<U> {
    return AsyncIterator.generator(map(this.generator, fn));
  }

  public flatMap<U>(fn: (x: T) => AsyncIterable<U>): AsyncIterator<U> {
    return AsyncIterator.generator(flatMap(this.generator, fn));
  }

  public filter(fn: (x: T) => MaybePromise<boolean>): AsyncIterator<T> {
    return AsyncIterator.generator(filter(this.generator, fn));
  }

  public filterType<U extends T>(fn: (x: T) => x is U): AsyncIterator<U> {
    return AsyncIterator.generator(filterType(this.generator, fn));
  }

  public filterMap<U>(
    fn: (x: T) => MaybePromise<U | undefined>
  ): AsyncIterator<U> {
    return AsyncIterator.generator(filterMap(this.generator, fn));
  }

  public async fold<U>(
    initial: U,
    fn: (acc: U, x: T) => MaybePromise<U>
  ): Promise<U> {
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
  public takeWhile(fn: (x: T) => MaybePromise<boolean>): AsyncIterator<T> {
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
  public skipWhile(fn: (x: T) => MaybePromise<boolean>): AsyncIterator<T> {
    return AsyncIterator.generator(skipWhile(this.generator, fn));
  }

  /**
   * Produces a new iterator which executes the specified function on each
   * element before yielding it.
   * @param fn A function
   */
  public use(fn: (x: T) => MaybePromise<void>): AsyncIterator<T> {
    return AsyncIterator.generator(use(this.generator, fn));
  }

  /**
   * Executes the specified function once on each element of this iterator.
   * @param fn A function
   */
  public async forEach(fn: (x: T) => MaybePromise<void>): Promise<void> {
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
  public async any(fn: (x: T) => MaybePromise<boolean>): Promise<boolean> {
    return !!(await this.find(fn));
  }

  /**
   * Determines whether every element of this iterator satisfies the given
   * predicate.
   * @param fn A predicate function
   */
  public async all(fn: (x: T) => MaybePromise<boolean>): Promise<boolean> {
    return !(await this.any(async (x) => !(await fn(x))));
  }

  /**
   * Produces the first element of this iterator that satisfies the given predicate.
   * @param fn A predicate function
   */
  public find(fn: (x: T) => MaybePromise<boolean>): Promise<T | undefined> {
    return this.filter(fn).first();
  }

  public async first(): Promise<T | undefined> {
    for await (const x of this.generator) {
      return x;
    }
  }

  public async count(): Promise<number> {
    let count = 0;
    await this.forEach(async () => {
      count += 1;
    });
    return count;
  }
}

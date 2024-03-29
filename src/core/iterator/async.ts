import {UUID, UUIDManager} from '@/core/uuid';
import {Iterator} from './sync';

type MaybePromise<T> = T | Promise<T>;

type MaybeAsyncIterable<T> = AsyncIterable<T> | Iterable<T>;

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
  fn: (x: T) => MaybeAsyncIterable<U>
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

      // Immediately stop if this was the last iteration
      if (i === num) {
        return;
      }
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

async function* takeUntil<T>(
  gen: AsyncIterable<T>,
  fn: (x: T) => MaybePromise<boolean>
): AsyncIterable<T> {
  for await (const x of gen) {
    if (await fn(x)) {
      break;
    } else {
      yield x;
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
    fn(x);
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

async function* zip<T, U>(
  a: AsyncIterable<T>,
  b: AsyncIterable<U>
): AsyncIterable<[T, U]> {
  const aGen = a[Symbol.asyncIterator]();
  const bGen = b[Symbol.asyncIterator]();

  while (true) {
    const [aVal, bVal] = await Promise.all([aGen.next(), bGen.next()]);

    if (!(aVal.done || bVal.done)) {
      yield [aVal.value, bVal.value];
    } else {
      break;
    }
  }
}

async function* debounce<T>(
  gen: AsyncIterable<T>,
  time: number
): AsyncIterable<T> {
  const timeMs = time * 1000;
  let lastTime = Date.now();

  for await (const x of gen) {
    const currentTime = Date.now();
    if (currentTime - lastTime >= timeMs) {
      lastTime = currentTime;
      yield x;
    }
  }
}

async function* takeEachN<T>(
  gen: AsyncIterable<T>,
  n: number
): AsyncIterable<T> {
  let counter = 0;
  for await (const x of gen) {
    counter += 1;
    while (counter >= n) {
      counter -= n;
      yield x;
    }
  }
}

interface IteratorFunctions<T> {
  $yield(arg: T): Promise<void>;
  $yieldAll(args: Iterable<T>): Promise<void>;
  $return(): Promise<void>;
}

class IteratorBuilder<T> {
  private yieldQueue: T[] = [];
  private resolver = (_?: void) => {};
  private yieldResolver = (_?: void) => {};
  private guard = new Promise<void>((resolve) => {
    this.resolver = resolve;
  });
  private yieldGuard = new Promise<void>((resolve) => {
    this.yieldResolver = resolve;
  });
  private isRunning: boolean = true;

  constructor(body: (_: IteratorFunctions<T>) => void) {
    body({
      $yield: this.$yield.bind(this),
      $yieldAll: this.$yieldAll.bind(this),
      $return: this.$return.bind(this),
    });
  }

  private async $yield(arg: T): Promise<void> {
    this.yieldQueue.push(arg);
    this.resolver();
    this.guard = new Promise<void>((resolve) => {
      this.resolver = resolve;
    });
    await this.yieldGuard;
  }

  private async $return(): Promise<void> {
    this.resolver();
    this.isRunning = false;
    await this.yieldGuard;
  }

  private async $yieldAll(args: Iterable<T>): Promise<void> {
    for (const x of args) {
      await this.$yield(x);
    }
  }

  public async *iterate(): AsyncIterable<T> {
    while (this.isRunning) {
      yield* this.yieldQueue;
      this.yieldQueue = [];
      this.yieldResolver();
      this.yieldGuard = new Promise((resolve) => {
        this.yieldResolver = resolve;
      });
      await this.guard;
    }
  }
}

export class AsyncIterator<T> implements AsyncIterable<T> {
  public onComplete?: () => void;

  private generator: AsyncIterable<T>;
  private subscribers: Record<UUID, IteratorFunctions<T>> = {};

  constructor(generator: AsyncIterable<T>, onComplete?: () => void) {
    this.generator = generator;
    this.onComplete = onComplete;
  }

  public static generator<T>(
    generator: AsyncIterable<T>,
    onComplete?: () => void
  ): AsyncIterator<T> {
    return new AsyncIterator(generator, onComplete);
  }

  public static from<T>(
    body: (fns: IteratorFunctions<T>) => void,
    onComplete?: () => void
  ): AsyncIterator<T> {
    const builder = new IteratorBuilder<T>(body);
    return AsyncIterator.generator(builder.iterate(), onComplete);
    // return AsyncIterator.generator(buildIterator(body), onComplete);
  }

  public async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    for await (const x of this.generator) {
      // Notify subscribers
      Iterator.values(this.subscribers).forEach(({$yield}) => $yield(x));

      yield x;
    }
  }

  private chain<U>(gen: AsyncIterable<U>): AsyncIterator<U> {
    return AsyncIterator.generator(gen, this.onComplete);
  }

  public debounce(time: number): AsyncIterator<T> {
    return this.chain(debounce(this, time));
  }

  public enumerate(): AsyncIterator<[T, number]> {
    return this.chain(enumerate(this));
  }

  public map<U>(fn: (x: T) => MaybePromise<U>): AsyncIterator<U> {
    return this.chain(map(this, fn));
  }

  public flatMap<U>(fn: (x: T) => MaybeAsyncIterable<U>): AsyncIterator<U> {
    return this.chain(flatMap(this, fn));
  }

  public filter(fn: (x: T) => MaybePromise<boolean>): AsyncIterator<T> {
    return this.chain(filter(this, fn));
  }

  public filterType<U extends T>(fn: (x: T) => x is U): AsyncIterator<U> {
    return this.chain(filterType(this, fn));
  }

  public filterMap<U>(
    fn: (x: T) => MaybePromise<U | undefined>
  ): AsyncIterator<U> {
    return this.chain(filterMap(this, fn));
  }

  public async fold<U>(
    initial: U,
    fn: (acc: U, x: T) => MaybePromise<U>
  ): Promise<U> {
    let output = initial;
    for await (const x of this) {
      output = await fn(output, x);
    }
    this.cleanup();
    return output;
  }

  public join<U>(other: AsyncIterator<U>): AsyncIterator<T | U> {
    const iter = AsyncIterator.from<T | U>(async ({$yield}) => {
      const thisPromise = (async () => {
        for await (const x of this) {
          await $yield(x);
        }
      })();
      const otherPromise = (async () => {
        for await (const y of other) {
          await $yield(y);
        }
      })();
      await Promise.all([thisPromise, otherPromise]);
    });

    iter.onComplete = () => {
      this.onComplete?.();
      other.onComplete?.();
    };

    return iter;
  }

  /**
   * Produces a new iterator which yields some number of elements from the
   * beginning of this iterator.
   *
   * @param amount The number of elements to take
   */
  public take(amount: number): AsyncIterator<T> {
    return this.chain(take(this, amount));
  }

  /**
   * Produces a new iterator which yields values until one does not satisfy
   * the given predicate. The first value not to satisfy the given predicate is
   * not included in the new iterator.
   *
   * @param fn A predicate function
   */
  public takeWhile(fn: (x: T) => MaybePromise<boolean>): AsyncIterator<T> {
    return this.chain(takeWhile(this, fn));
  }

  public takeUntil(fn: (x: T) => MaybePromise<boolean>): AsyncIterator<T> {
    return this.chain(takeUntil(this, fn));
  }

  /**
   * Produces a new iterator which ignores some number of elements at the
   * beginning.
   *
   * @param amount The number of elements to skip
   */
  public skip(amount: number): AsyncIterator<T> {
    return this.chain(skip(this, amount));
  }

  /**
   * Produces a new iterator which ignores elements of this iterator while a
   * given predicate holds. The first element of the new iterator will be the
   * first element which does not satisfy the given predicate.
   *
   * @param fn A predicate function
   */
  public skipWhile(fn: (x: T) => MaybePromise<boolean>): AsyncIterator<T> {
    return this.chain(skipWhile(this, fn));
  }

  /**
   * Produces a new iterator which executes the specified function on each
   * element before yielding it.
   *
   * @param fn A function
   */
  public use(fn: (x: T) => MaybePromise<void>): AsyncIterator<T> {
    return this.chain(use(this, fn));
  }

  /**
   * Executes the specified function once on each element of this iterator.
   *
   * @param fn A function
   */
  public async forEach(fn: (x: T) => MaybePromise<void>): Promise<void> {
    for await (const x of this) {
      fn(x);
    }
    this.cleanup();
  }

  /**
   * Produces an array containing all elements of this iterator.
   */
  public async toArray(): Promise<T[]> {
    const arr = [];
    for await (const x of this) {
      arr.push(x);
    }
    this.cleanup();
    return arr;
  }

  /**
   * Determines whether at least one element of this iterator satisfies the
   * given predicate.
   *
   * @param fn A predicate function
   */
  public async some(fn: (x: T) => MaybePromise<boolean>): Promise<boolean> {
    const res = !!(await this.find(fn));
    this.cleanup();
    return res;
  }

  /**
   * Determines whether every element of this iterator satisfies the given
   * predicate.
   *
   * @param fn A predicate function
   */
  public async all(fn: (x: T) => MaybePromise<boolean>): Promise<boolean> {
    const didAnyFail = await this.some(async (x) => !(await fn(x)));
    return !didAnyFail;
  }

  /**
   * Produces the first element of this iterator that satisfies the given predicate.
   *
   * @param fn A predicate function
   */
  public find(fn: (x: T) => MaybePromise<boolean>): Promise<T | undefined> {
    return this.filter(fn).first();
  }

  public async first(): Promise<T | undefined> {
    for await (const x of this) {
      return x;
    }
  }

  public async count(): Promise<number> {
    let count = 0;
    await this.forEach(() => {
      count += 1;
    });
    return count;
  }

  public removeSubscriber(id: UUID) {
    delete this.subscribers[id];
    UUIDManager.free(id);
  }

  public subscribe(): IteratorSubscriber<T> {
    const id = UUIDManager.generate();
    return new IteratorSubscriber(
      this,
      id,
      AsyncIterator.from((fns) => {
        this.subscribers[id] = fns;
      })
    );
  }

  public drain(): Promise<void> {
    return this.forEach(() => {});
  }

  public zip<U>(b: AsyncIterable<U>): AsyncIterator<[T, U]> {
    return AsyncIterator.generator(zip(this.generator, b));
  }

  public takeEachN(n: number): AsyncIterator<T> {
    return this.chain(takeEachN(this, n));
  }

  private cleanup() {
    this.onComplete?.();
    Iterator.entries(this.subscribers).forEach(async ([id, {$return}]) => {
      this.removeSubscriber(id);
      await $return();
    });
  }
}

export class IteratorSubscriber<T> extends AsyncIterator<T> {
  private id: UUID;
  private parent: AsyncIterator<T>;

  public constructor(
    parent: AsyncIterator<T>,
    id: UUID,
    iterator: AsyncIterable<T>
  ) {
    super(iterator);
    this.parent = parent;
    this.id = id;
  }

  public unsubscribe() {
    this.parent.removeSubscriber(this.id);
    UUIDManager.free(this.id);
  }
}

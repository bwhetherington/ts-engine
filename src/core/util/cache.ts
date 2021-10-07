import {maybe as m} from 'core/monad';
import {IndexQueue} from 'core/util';

export class Cache<T> {
  private data: Map<string, T> = new Map();
  private index: IndexQueue<string>;

  private capacity_: number;

  constructor(capacity: number) {
    this.capacity_ = capacity;
    this.index = new IndexQueue(capacity);
  }

  public insert(key: string, value: T): void {
    const removed = this.index.enqueue(key);
    m.map(removed, (removed) => {
      this.data.delete(removed);
    });
    this.data.set(key, value);
  }

  public get(key: string): m.Maybe<T> {
    const value = this.data.get(key);
    if (value !== undefined) {
      this.index.resetNode(key);
    }
    return value;
  }

  public getOrInsert(key: string, gen: () => T): T {
    let value = this.get(key);
    if (value === undefined) {
      value = gen();
      this.insert(key, value);
    }
    return value;
  }

  public async getOrInsertAsync(
    key: string,
    gen: () => Promise<T>
  ): Promise<T> {
    let value = this.get(key);
    if (value === undefined) {
      value = await gen();
      this.insert(key, value);
    }
    return value;
  }
}

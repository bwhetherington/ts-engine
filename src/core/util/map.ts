import { Iterator } from "core/iterator";

export interface Key {
  hash(): number;
  equals(other: any): boolean;
}

export interface Entry<K extends Key, V> {
  key: K;
  value: V;
}

type Buckets<K extends Key, V> = Entry<K, V>[][];

export class HashMap<K extends Key, V> {
  private buckets: Buckets<K, V> = [];
  private size: number = 0;

  public constructor(capacity: number = 20) {
    this.buckets = this.allocateBuckets(capacity);
  }

  private getCapacity(): number {
    return this.buckets.length;
  }

  public getSize(): number {
    return this.size;
  }

  private *entriesInternal(): Iterable<Entry<K, V>> {
    for (let i = 0; i < this.buckets.length; i++) {
      yield* this.buckets[i];
    }
  }

  public entries(): Iterator<Entry<K, V>> {
    return Iterator.from(this.entriesInternal());
  }

  public values(): Iterator<V> {
    return this.entries().map(({value}) => value);
  }

  private allocateBuckets(capacity: number): Entry<K, V>[][] {
    const buckets = [];
    for (let i = 0; i < capacity; i++) {
      buckets.push([]);
    }
    return buckets;
  }

  private expand(newCapacity: number): void {
    const newBuckets = this.allocateBuckets(newCapacity);
    this.entries().forEach((entry) => this.insertEntry(entry, newBuckets));
    this.buckets = newBuckets;
  }

  private insertEntry(entry: Entry<K, V>, buckets: Buckets<K, V>): boolean {
    const bucketIndex = entry.key.hash() % buckets.length;
    const bucket = buckets[bucketIndex];

    for (let i = 0; i < bucket.length; i++) {
      const existing = bucket[i];
      if (existing.key.equals(entry.key)) {
        existing.value = entry.value;
        return false;
      }
    }

    bucket.push(entry);
    return true;
  }

  public insert(key: K, value: V): void {
    const entry = {key, value};
    const addedNewEntry = this.insertEntry(entry, this.buckets);
    if (addedNewEntry) {
      this.size += 1;
    }

    if (this.getSize() / this.getCapacity() > 0.7) {
      this.expand(this.getCapacity() * 2);
    }
  }

  public has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  public get(key: K): V | undefined {
    const bucketIndex = key.hash() % this.buckets.length;
    const bucket = this.buckets[bucketIndex];

    for (let i = 0; i < bucket.length; i++) {
      const entry = bucket[i];
      if (entry.key.equals(key)) {
        return entry.value;
      }
    }

    return undefined;
  }

  public remove(key: K): boolean {
    const bucketIndex = key.hash() % this.buckets.length;
    const bucket = this.buckets[bucketIndex];

    for (let i = 0; i < bucket.length; i++) {
      const entry = bucket[i];
      if (entry.key.equals(key)) {
        this.buckets[i] = bucket.filter((_, j) => j !== i);
        this.size -= 1;
        return true;
      }
    }

    return false;
  }
}
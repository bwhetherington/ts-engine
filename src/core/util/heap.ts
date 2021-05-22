import PriorityQueue from 'priorityqueuejs';

type Comparator<T> = (a: T, b: T) => number;

export class Heap<T> {
  private queue: PriorityQueue<T>;

  public constructor(compare: Comparator<T>) {
    this.queue = new PriorityQueue(compare);
  }

  public push(val: T): void {
    this.queue.enq(val);
  }

  public pop(): T | undefined {
    return this.queue.deq();
  }

  public isEmpty(): boolean {
    return this.queue.isEmpty();
  }
}

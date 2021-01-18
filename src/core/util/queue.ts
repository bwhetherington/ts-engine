import {iterator, Iterator} from 'core/iterator';

class Node<T> {
  public value: T;
  public prev?: Node<T>;
  public next?: Node<T>;

  constructor(value: T) {
    this.value = value;
  }
}

export class Queue<T> {
  private head?: Node<T>;
  private tail?: Node<T>;
  private length: number = 0;

  public size(): number {
    return this.length;
  }

  public isEmpty(): boolean {
    return this.size() === 0;
  }

  public *drain(): Iterable<T> {
    while (!this.isEmpty()) {
      const element = this.dequeue();
      if (element !== undefined) {
        yield element;
      }
    }
  }

  private *iteratorInternal(): Iterable<T> {
    let current = this.head;
    while (current !== undefined) {
      yield current.value;
      current = current.next;
    }
  }

  public iterator(): Iterator<T> {
    return iterator(this.iteratorInternal());
  }

  public enqueue(element: T): T | undefined {
    const node = new Node(element);

    const {tail} = this;

    if (this.length === 0) {
      this.head = node;
      this.tail = node;
    } else if (tail !== undefined) {
      // Put it after the tail
      node.prev = tail;
      tail.next = node;
      this.tail = node;
    }

    this.length += 1;
    return undefined;
  }

  public peek(): T | undefined {
    const {head} = this;
    if (head) {
      return head.value;
    }
  }

  public dequeue(): T | undefined {
    const {head} = this;
    if (head) {
      this.length -= 1;
      const element = head.value;
      if (head.next) {
        head.next.prev = undefined;
      } else {
        // We are now empty
        this.tail = undefined;
      }
      this.head = head.next;
      return element;
    }
  }
}

export class SizedQueue<T> extends Queue<T> {
  private capacity: number;

  constructor(capacity: number) {
    super();
    this.capacity = capacity;
  }

  public enqueue(element: T): T | undefined {
    super.enqueue(element);
    if (this.size() > this.capacity) {
      return this.dequeue();
    }
  }
}

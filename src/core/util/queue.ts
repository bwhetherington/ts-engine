import {iterator, Iterator} from 'core/iterator';
import {maybe as m} from 'core/monad';

class Node<T> {
  public value: T;
  public prev?: Node<T>;
  public next?: Node<T>;

  constructor(value: T) {
    this.value = value;
  }

  public append(item: T): void {
    const node = new Node(item);
    const temp = this.next;
    this.next = node;
    node.prev = this;
    node.next = temp;
  }

  public prepend(item: T): void {
    const node = new Node(item);
    const temp = this.prev;
    this.prev = node;
    node.prev = temp;
    node.next = this;
  }

  public delete(): void {
    if (this.prev) {
      this.prev.next = this.next;
    }

    if (this.next) {
      this.next.prev = this.prev;
    }

    delete this.prev;
    delete this.next;
  }
}

export class Queue<T> {
  protected head?: Node<T>;
  protected tail?: Node<T>;
  protected length: number = 0;

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

  protected insertNode(node: Node<T>): m.Maybe<Node<T>> {
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

  public enqueue(element: T): m.Maybe<T> {
    const node = new Node(element);
    return m.map(this.insertNode(node), (node) => node.value);
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

export class ScrollableQueue<T> extends Queue<T> {
  private cursor?: Node<T>;

  public getCursor(): T | undefined {
    return this.cursor?.value;
  }

  public beginScroll(): void {
    this.cursor = this.tail;
  }

  public scrollUp(): Node<T> | undefined {
    this.cursor = this.cursor?.prev;
    return this.cursor;
  }

  public scrollDown(): Node<T> | undefined {
    this.cursor = this.cursor?.next;
    return this.cursor;
  }
}

export class IndexQueue<T> extends SizedQueue<T> {
  private index: Map<T, Node<T>> = new Map();

  protected insertNode(node: Node<T>): m.Maybe<Node<T>> {
    this.index.set(node.value, node);
    return super.insertNode(node);
  }

  protected removeNode(node: Node<T>): void {
    this.length -= 1;

    if (node === this.head) {
      this.head = node.next;
    }

    if (node === this.tail) {
      this.tail = node.prev;
    }

    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }

    this.index.delete(node.value);
  }

  protected getNode(item: T): m.Maybe<Node<T>> {
    return this.index.get(item);
  }

  public resetNode(item: T): void {
    const node = this.getNode(item);
    if (node) {
      this.removeNode(node);
      this.enqueue(item);
    }
  }
}

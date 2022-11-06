interface QueueEntry<T> {
  value: T;
  prev: QueueEntry<T>;
  next: QueueEntry<T>;
}

export class PriorityQueue<T extends object> implements Iterable<T> {
  get size() {
    return this._size;
  }

  private lookup = new WeakMap<T, QueueEntry<T>>();
  private begin: QueueEntry<T> = null;
  private end: QueueEntry<T> = null;
  private _size = 0;

  constructor(private readonly predicate: (a: T, b: T) => number) {}

  enqueue(value: T) {
    let entry: QueueEntry<T>;

    if (this.end === null) {
      this.begin =
        this.end =
        entry =
          {
            value,
            prev: null,
            next: null,
          };
    } else {
      let p = this.end;
      while (p && this.predicate(p.value, value) > 0) {
        p = p.prev;
      }

      if (!p) {
        // beginning
        entry = { value, prev: null, next: this.begin };
        this.begin.prev = entry;
        this.begin = entry;
      } else if (!p.next) {
        // end
        entry = { value, prev: p, next: null };
        this.end.next = entry;
        this.end = entry;
      } else {
        // in between
        entry = { value, prev: p, next: p.next };
        p.next.prev = entry;
        p.next = entry;
      }
    }
    this.lookup.set(value, entry);
    this._size++;
  }

  dequeue(): T {
    if (this._size === 0) {
      return null;
    }

    if (!this.begin) {
      debugger;
    }

    const value = this.begin.value;
    if (this.begin.next) {
      this.begin.next.prev = null;
      this.begin = this.begin.next;
    } else {
      this.begin = this.end = null;
    }

    this._size--;
    this.lookup.delete(value);

    return value;
  }

  *[Symbol.iterator]() {
    for (let p = this.begin; p != null; p = p.next) {
      yield p.value;
    }
  }
}

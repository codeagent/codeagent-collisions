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

  resort(): void {
    if (this._size < 2) {
      return;
    }

    let p = this.begin.next;

    while (p !== null) {
      let q = p.prev;
      const n = p.next;

      while (q && this.predicate(q.value, p.value) > 0) {
        q = q.prev;
      }

      if (q !== p.prev) {
        if (p.prev) {
          p.prev.next = p.next;
        }

        if (p.next) {
          p.next.prev = p.prev;
        } else {
          this.end = p.prev;
          this.end.next = null;
        }

        if (q) {
          q.next.prev = p;
          p.next = q.next;
          q.next = p;
          p.prev = q;
        } else {
          p.next = this.begin;
          p.prev = null;
          this.begin.prev = p;
          this.begin = p;
        }
      }

      p = n;
    }
  }

  dequeue(): T {
    if (this._size === 0) {
      return null;
    }

    const value = this.begin.value;
    if (this.begin.next) {
      this.begin.next.prev = null;
    }
    this.begin = this.begin.next;
    this._size--;
    this.lookup.delete(value);

    return value;
  }

  remove(value: T) {
    if (!this.lookup.has(value)) {
      return;
    }

    const entry = this.lookup.get(value);
    if (entry.prev && entry.next) {
      entry.prev.next = entry.next;
      entry.next.prev = entry.prev;
    } else if (entry.next) {
      entry.next.prev = null;
      this.begin = entry.next;
    } else if (entry.prev) {
      entry.prev.next = null;
      this.end = entry.prev;
    } else {
      this.end = this.begin = null;
    }

    this.lookup.delete(value);

    this._size--;
  }

  *[Symbol.iterator]() {
    for (let p = this.begin; p != null; p = p.next) {
      yield p.value;
    }
  }
}

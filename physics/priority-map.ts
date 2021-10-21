interface MapEntry<K, V> {
  key: K;
  value: V;
  prev: MapEntry<K, V>;
  next: MapEntry<K, V>;
}

const defaultPredicate = <T>(a: T, b: T): number => Number(a) - Number(b);

export class PriorityMap<K, V> implements Map<K, V>, Iterable<[K, V]> {
  get size() {
    return this.lookup.size;
  }

  get [Symbol.toStringTag]() {
    return 'PriorityMap';
  }

  private lookup = new Map<K, MapEntry<K, V>>();
  private begin: MapEntry<K, V> = null;
  private end: MapEntry<K, V> = null;

  constructor(
    entries?: [K, V][] | null,
    private readonly predicate: (a: K, b: K) => number = defaultPredicate
  ) {
    if (entries) {
      entries.forEach(([key, value]) => this.set(key, value));
    }
  }

  clear(): void {
    this.begin = this.end = null;
    this.lookup.clear();
  }

  delete(key: K): boolean {
    if (!this.lookup.has(key)) {
      return false;
    }
    const entry = this.lookup.get(key);
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
    return this.lookup.delete(key);
  }

  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ): void {
    for (const [key, value] of this) {
      callbackfn.call(thisArg ?? this, value, key, this);
    }
  }

  get(key: K): V | undefined {
    if (this.lookup.has(key)) {
      return this.lookup.get(key).value;
    }
    return undefined;
  }

  has(key: K): boolean {
    return this.lookup.has(key);
  }

  set(key: K, value: V): this {
    if (this.lookup.has(key)) {
      this.lookup.get(key).value = value;
    } else {
      let entry: MapEntry<K, V>;
      if (this.end === null) {
        this.begin =
          this.end =
          entry =
            {
              value,
              key,
              prev: null,
              next: null,
            };
      } else {
        let p = this.end;
        while (p && this.predicate(p.key, key) > 0) {
          p = p.prev;
        }

        if (!p) {
          // beginning
          entry = { key, value, prev: null, next: this.begin };
          this.begin.prev = entry;
          this.begin = entry;
        } else if (!p.next) {
          // end
          entry = { key, value, prev: p, next: null };
          this.end.next = entry;
          this.end = entry;
        } else {
          // in between
          entry = { key, value, prev: p, next: p.next };
          p.next.prev = entry;
          p.next = entry;
        }
      }
      this.lookup.set(key, entry);
    }
    return this;
  }

  *entries() {
    yield* this;
  }

  *values() {
    for (const [, v] of this) {
      yield v;
    }
  }

  *keys() {
    for (const [k] of this) {
      yield k;
    }
  }

  *[Symbol.iterator]() {
    for (let p = this.begin; p != null; p = p.next) {
      yield [p.key, p.value] as [K, V];
    }
  }
}

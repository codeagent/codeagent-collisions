class StackEntry {
  constructor(
    public readonly block: Float32Array,
    public readonly offset: number,
    public readonly size: number
  ) {}
}

export class StackAllocator {
  get length(): number {
    return this.stack.length;
  }

  private readonly buffer: Float32Array;
  private readonly stack: StackEntry[] = [];
  private offset: number = 0;

  constructor(public readonly size: number) {
    this.buffer = new Float32Array(size);
  }

  allocate(size: number): Float32Array {
    if (size + this.offset > this.size) {
      const free = this.size - this.offset;
      throw new Error(
        `StackAllocator.allocate: Not enough memory to allocate, requested: ${size}, free: ${free}`
      );
    }

    const entry = new StackEntry(
      this.buffer.subarray(this.offset, this.offset + size),
      this.offset,
      size
    );
    this.stack.push(entry);

    this.offset += size;

    return entry.block;
  }

  free(entries: number = 1): void {
    for (let i = 0; i < entries; i++) {
      if (this.stack.length === 0) {
        throw new Error(`StackAllocator.allocate: Stack is empty`);
      }

      const entry = this.stack.pop();
      this.offset -= entry.size;
    }
  }

  clear(): void {
    this.stack.length = 0;
    this.offset = 0;
  }

  dump(): void {
    console.table(this.stack);
  }
}

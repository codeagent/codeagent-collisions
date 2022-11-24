class StackEntry<T extends ArrayBufferView> {
  constructor(
    public readonly block: T,
    public readonly offset: number, // in bytes
    public readonly size: number // in butes
  ) {}
}

type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

export class Stack {
  public readonly size: number = 0;
  private readonly stack: StackEntry<ArrayBufferView>[] = [];
  private offset: number = 0;

  constructor(public readonly buffer: Uint8Array) {
    this.size = this.buffer.length;
  }

  pushInt8(length: number): Int8Array {
    return this.pushTypedArray(Int8Array, length);
  }

  pushUint8(length: number): Uint8Array {
    return this.pushTypedArray(Uint8Array, length);
  }

  pushInt16(length: number): Int16Array {
    return this.pushTypedArray(Int16Array, length);
  }

  pushUint16(length: number): Uint16Array {
    return this.pushTypedArray(Uint16Array, length);
  }

  pushInt32(length: number): Int32Array {
    return this.pushTypedArray(Int32Array, length);
  }

  pushUint32(length: number): Uint32Array {
    return this.pushTypedArray(Uint32Array, length);
  }

  pushFloat32(length: number): Float32Array {
    return this.pushTypedArray(Float32Array, length);
  }

  pushFloat64(length: number): Float64Array {
    return this.pushTypedArray(Float64Array, length);
  }

  pop(count: number = 1): void {
    while (count > 0) {
      if (this.stack.length === 0) {
        throw new Error('Stack.pop: Stack is empty');
      }

      const entry = this.stack.pop();
      this.offset -= entry.size;
      count--;
    }
  }

  clear(): void {
    this.stack.length = 0;
    this.offset = 0;
  }

  dump(): void {
    console.table(this.stack);
  }

  private pushTypedArray<T extends ArrayBufferView>(
    type: TypedArrayConstructor,
    length: number
  ): T {
    const bytes = length * type.BYTES_PER_ELEMENT;

    if (bytes + this.offset > this.size) {
      const free = this.size - this.offset;
      throw new Error(
        `Stack.push: Not enough memory to allocate, requested: ${bytes}, free: ${free} bytes`
      );
    }

    const entry = new StackEntry(
      new type(this.buffer.buffer, this.offset, length),
      this.offset,
      bytes
    );
    this.offset += bytes;
    this.stack.push(entry);

    return entry.block as unknown as T;
  }
}

import { Inject, Service } from 'typedi';

import { Settings } from '../settings';

class MemoryBlock {
  public prev: MemoryBlock = null;
  public next: MemoryBlock = null;
  public readonly end: number;

  constructor(
    public readonly array: Uint8Array,
    public readonly start: number,
    public readonly size: number
  ) {
    this.end = this.start + this.size;
  }
}

@Service()
export class Memory {
  private static readonly MIN_BLOCK_SIZE = 32;
  public readonly size: number;
  private readonly buffer: Uint8Array;
  private readonly freeList: MemoryBlock;
  private readonly reserved = new WeakMap<Uint8Array, MemoryBlock>();

  constructor(@Inject('SETTINGS') settings: Settings) {
    this.buffer = new Uint8Array((this.size = settings.totalReservedMemory));
    this.freeList = new MemoryBlock(this.buffer, 0, this.size);
  }

  reserve(size: number): Uint8Array {
    if (size < Memory.MIN_BLOCK_SIZE) {
      throw new Error(
        `Memory.reserve: failed to reserve block with size ${size} - minimal allowed size is ${Memory.MIN_BLOCK_SIZE}`
      );
    }

    const block = this.bestFit(size);
    if (!block) {
      throw new Error(
        `Memory.reserve: failed to reserve block with size ${size} - no such block can be found`
      );
    }

    if (block.size !== size) {
      // Split into two
      const left = new MemoryBlock(
        this.buffer.subarray(block.start, block.start + size),
        block.start,
        size
      );

      const right = new MemoryBlock(
        this.buffer.subarray(block.start + size, block.end),
        block.start + size,
        block.size - size
      );

      right.prev = block.prev;
      right.next = block.next;

      if (block.prev) {
        block.prev.next = right;
      }

      if (block.next) {
        block.next.prev = right;
      }

      block.next = block.prev = null;
      this.reserved.set(left.array, left);

      return left.array;
    } else {
      // remove from free list
      if (block.next) {
        block.next.prev = block.prev;
      }

      if (block.prev) {
        block.prev.next = block.next;
      }

      block.next = block.prev = null;
      this.reserved.set(block.array, block);

      return block.array;
    }
  }

  free(buffer: Uint8Array): void {
    const block = this.reserved.get(buffer);
    if (!block) {
      throw new Error(
        'Memory.free: failed to release block - it seems that buffer was created somewhere outside'
      );
    }

    let left = this.firstSibling(block);
    let right = left ? left.next : null;

    if (
      left &&
      left.end === block.start &&
      right &&
      right.start === block.end
    ) {
      this.mergeInBetween(left, block, right);
      this.reserved.delete(left.array);
      this.reserved.delete(block.array);
      this.reserved.delete(right.array);
    } else if (left && left.end === block.start) {
      this.mergeRight(left, block);
      this.reserved.delete(left.array);
      this.reserved.delete(block.array);
    } else if (right && right.start === block.end) {
      this.mergeLeft(block, right);
      this.reserved.delete(block.array);
      this.reserved.delete(right.array);
    } else {
      block.prev = left;
      block.next = right;

      if (left) {
        left.next = block;
      }

      if (right) {
        right.prev = block;
      }

      this.reserved.delete(block.array);
    }
  }

  clear(): void {
    // break free list chain
    let block = this.freeList;
    while (block !== null) {
      const next = block.next;
      block.prev = null;
      block.next = null;
      this.reserved.delete(block.array);

      block = next;
    }

    this.buffer.fill(0);
  }

  dump(): void {
    const table: MemoryBlock[] = [];
    let block = this.freeList;
    while (block !== null) {
      table.push(block);
      block = block.next;
    }

    console.table(table, ['start', 'size', 'end']);
  }

  private mergeLeft(left: MemoryBlock, right: MemoryBlock): void {
    const block = new MemoryBlock(
      this.buffer.subarray(left.start, right.end),
      left.start,
      left.size + right.size
    );

    block.prev = right.prev;
    block.next = right.next;

    if (right.prev) {
      right.prev.next = block;
    }

    if (right.next) {
      right.next.prev = block;
    }

    left.prev = left.next = null;
    right.prev = right.next = null;
  }

  private mergeInBetween(
    left: MemoryBlock,
    mid: MemoryBlock,
    right: MemoryBlock
  ): void {
    const block = new MemoryBlock(
      this.buffer.subarray(left.start, right.end),
      left.start,
      left.size + mid.size + right.size
    );

    block.prev = left.prev;
    block.next = right.next;

    if (left.prev) {
      left.prev.next = block;
    }

    if (right.next) {
      right.next.prev = block;
    }

    left.prev = left.next = null;
    mid.prev = mid.next = null;
    right.prev = right.next = null;
  }

  private mergeRight(left: MemoryBlock, right: MemoryBlock): void {
    const block = new MemoryBlock(
      this.buffer.subarray(left.start, right.end),
      left.start,
      left.size + right.size
    );

    block.prev = left.prev;
    block.next = left.next;

    if (left.prev) {
      left.prev.next = block;
    }

    if (left.next) {
      left.next.prev = block;
    }

    left.prev = left.next = null;
    right.prev = right.next = null;
  }

  private bestFit(size: number): MemoryBlock {
    let block = this.freeList;
    let best = this.freeList;

    while (block !== null) {
      if (block.size >= size) {
        if (best.size > block.size) {
          best = block;
        }
      }

      block = block.next;
    }

    return best;
  }

  private firstSibling(block: MemoryBlock): MemoryBlock {
    let sibling = this.freeList;

    while (sibling !== null && sibling.end <= block.start) {
      sibling = sibling.next;
    }

    if (sibling) {
      return sibling.prev;
    }

    return null;
  }
}

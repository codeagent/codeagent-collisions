import { Service } from 'typedi';

@Service()
export class IdManager {
  private counter = 0;
  private readonly freeList: number[] = [];

  getUniqueId(): number {
    return this.freeList.length === 0 ? ++this.counter : this.freeList.shift();
  }

  releaseId(id: number): void {
    this.freeList.push(id);
  }

  reset(): void {
    this.counter = 0;
    this.freeList.length = 0;
  }
}

export const pairId = (id0: number, id1: number) =>
  id0 > id1 ? (id0 << 15) | id1 : (id1 << 15) | id0;

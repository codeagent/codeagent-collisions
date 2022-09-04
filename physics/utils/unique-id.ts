class IdManager {
  private counter = 0;
  private readonly freeList: number[] = [];

  getUniqueId(): number {
    return this.freeList.length === 0 ? ++this.counter : this.freeList.shift();
  }

  releaseId(id: number): void {
    this.freeList.push(id);
  }

  pairId(id0: number, id1: number): number {
    return id0 > id1 ? (id0 << 15) | id1 : (id1 << 15) | id0;
  }

  reset(): void {
    this.counter = 0;
    this.freeList.length = 0;
  }
}

const manager = new IdManager();

export const uniqueId = () => manager.getUniqueId();
export const releaseId = (id: number) => manager.releaseId(id);
export const pairId = (id0: number, id1: number) => manager.pairId(id0, id1);
export const reset = () => manager.reset();

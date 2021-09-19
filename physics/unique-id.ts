let counter = 0;
const freeList: number[] = [];

export const uniqueId = () =>
  freeList.length === 0 ? ++counter : freeList.shift();

export const releaseId = (id: number) => freeList.push(id);

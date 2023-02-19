import { PriorityQueue } from 'rb-phys2d';

interface Item {
  value: number;
}

describe('PriorityQueue', () => {
  const predicate = (a: Item, b: Item): number => a.value - b.value;

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  it('should be intialized with no elements', () => {
    // Arrange
    const queue = new PriorityQueue<Item>(predicate);

    // Assert
    expect(queue.size).toBe(0);
    expect(Array.from(queue)).toEqual([]);
  });

  describe('enqueue', () => {
    it('should enqueue value with sort preserving', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [
        { value: 3 },
        { value: 2 },
        { value: 5 },
        { value: 7 },
        { value: -1 },
      ];

      // Act
      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);
      queue.enqueue(values[4]);

      // Assert
      expect(Array.from(queue)).toEqual([
        values[4],
        values[1],
        values[0],
        values[2],
        values[3],
      ]);
    });

    it('should increase length', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);

      // Act
      queue.enqueue({ value: 2 });
      queue.enqueue({ value: 1 });
      queue.enqueue({ value: 0 });

      // Assert
      expect(queue.size).toEqual(3);
    });
  });

  describe('dequeue', () => {
    it('should dequeue value from beginning', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [
        { value: 3 },
        { value: 2 },
        { value: 5 },
        { value: 7 },
        { value: -1 },
      ];
      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);
      queue.enqueue(values[4]);

      // Act
      const actual = queue.dequeue();

      // Assert
      expect(actual).toBe(values[4]);
    });

    it('should decrease length', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      queue.enqueue({ value: 2 });
      queue.enqueue({ value: 1 });
      queue.enqueue({ value: 0 });

      // Act
      queue.dequeue();

      // Assert
      expect(queue.size).toEqual(2);
    });

    it('should update queue', () => {
      const queue = new PriorityQueue<Item>(predicate);
      const values = [
        { value: 3 },
        { value: 2 },
        { value: 5 },
        { value: 7 },
        { value: -1 },
      ];
      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);
      queue.enqueue(values[4]);

      // Act
      queue.dequeue();

      // Assert
      expect(Array.from(queue)).toEqual([
        values[1],
        values[0],
        values[2],
        values[3],
      ]);
    });

    it('should return null when queue is empty', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);

      // Act
      const actual = queue.dequeue();

      // Assert
      expect(actual).toEqual(null);
      expect(Array.from(queue)).toEqual([]);
      expect(queue.size).toBe(0);
    });
  });

  describe('remove', () => {
    it('should remove entry from the beginning of queue', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [
        { value: 3 },
        { value: 2 },
        { value: 5 },
        { value: 7 },
        { value: -1 },
      ];
      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);
      queue.enqueue(values[4]);

      // Act
      queue.remove(values[4]);

      // Assert
      expect(Array.from(queue)).toEqual([
        values[1],
        values[0],
        values[2],
        values[3],
      ]);
      expect(queue.size).toBe(4);
    });

    it('should remove entry from the middle of queue', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [
        { value: 3 },
        { value: 2 },
        { value: 5 },
        { value: 7 },
        { value: -1 },
      ];
      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);
      queue.enqueue(values[4]);

      // Act
      queue.remove(values[0]);

      // Assert
      expect(Array.from(queue)).toEqual([
        values[4],
        values[1],
        values[2],
        values[3],
      ]);
      expect(queue.size).toBe(4);
    });

    it('should remove entry from the end of queue', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [
        { value: 3 },
        { value: 2 },
        { value: 5 },
        { value: 7 },
        { value: -1 },
      ];
      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);
      queue.enqueue(values[4]);

      // Act
      queue.remove(values[3]);

      // Assert
      expect(Array.from(queue)).toEqual([
        values[4],
        values[1],
        values[0],
        values[2],
      ]);
      expect(queue.size).toBe(4);
    });

    it('should remove last entry from queue', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const entry = { value: 0 };
      queue.enqueue(entry);

      // Act
      queue.remove(entry);

      // Assert
      expect(Array.from(queue)).toEqual([]);
      expect(queue.size).toBe(0);
    });
  });

  describe('resort', () => {
    it('should not change sorted queue', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
      ];
      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);
      queue.enqueue(values[4]);

      // Act
      queue.resort();

      // Assert
      expect(Array.from(queue)).toEqual(values);
    });

    it('should resort #1', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [{ value: 1 }];
      queue.enqueue(values[0]);

      // Act
      queue.resort();

      // Assert
      expect(Array.from(queue)).toEqual(values);
    });

    it('should resort #2', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [{ value: 0 }, { value: 1 }];

      queue.enqueue(values[0]);
      queue.enqueue(values[1]);

      values[0].value = 2;
      values[1].value = 1;

      // Act
      queue.resort();

      // Assert
      expect(Array.from(queue)).toEqual([values[1], values[0]]);
    });

    it('should resort #3', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }];

      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);

      values[0].value = 0;
      values[1].value = 2;
      values[2].value = 1;
      values[3].value = 3;

      // Act
      queue.resort();

      // Assert
      expect(Array.from(queue)).toEqual([
        values[0],
        values[2],
        values[1],
        values[3],
      ]);
    });

    it('should resort #4', () => {
      // Arrange
      const queue = new PriorityQueue<Item>(predicate);
      const values = [
        { value: 0 },
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
      ];

      queue.enqueue(values[0]);
      queue.enqueue(values[1]);
      queue.enqueue(values[2]);
      queue.enqueue(values[3]);

      values[0].value = 0;
      values[1].value = 2;
      values[2].value = 1;
      values[3].value = 3;

      // Act
      queue.resort();

      // Assert
      expect(Array.from(queue)).toEqual([
        values[0],
        values[2],
        values[1],
        values[3],
      ]);
    });
  });
});

import { PriorityQueue } from 'js-physics-2d';

interface Item {
  value: number;
}

describe('PriorityQueue', () => {
  const predicate = (a: Item, b: Item) => a.value - b.value;

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
      const actual = queue.dequeue();

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
});

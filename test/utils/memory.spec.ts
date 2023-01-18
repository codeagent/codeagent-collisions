import { Memory, configureContainer } from 'rb-phys2d';
import { ContainerInstance } from 'typedi';

describe('Memory', () => {
  let memory: Memory;
  let container: ContainerInstance;

  beforeEach(() => {
    container = configureContainer({ totalReservedMemory: 512 });
    memory = container.get(Memory);
  });

  afterEach(() => {
    memory.clear();
  });

  it('should be non null', () => {
    // assert
    expect(memory).not.toBeFalsy();
  });

  it('should have buffer size', () => {
    // assert
    expect(memory.size).toBe(512);
  });

  it('should have initial state', () => {
    // assert
    expect(memory['freeList']).toEqual(
      expect.objectContaining({
        size: 512,
        prev: null,
        next: null,
      })
    );
  });

  describe('reserve', () => {
    it('should reserve block of memory #1', () => {
      // Act
      const bytes = memory.reserve(64);

      // Assert
      expect(bytes.length).toEqual(64);
    });

    it('should reserve block of memory #2', () => {
      // Act
      memory.reserve(64);
      memory.reserve(64);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 128,
          size: 384,
          end: 512,
        }),
      ]);
    });

    // #region best fit

    it('should reserve block of memory #3', () => {
      // Arrange
      const block0 = memory.reserve(32);
      memory.reserve(32);
      const block2 = memory.reserve(64);
      memory.reserve(32);
      const block4 = memory.reserve(128);
      memory.reserve(32);

      memory.free(block0);
      memory.free(block2);
      memory.free(block4);

      // Act
      memory.reserve(128);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 0,
          size: 32,
          end: 32,
        }),
        expect.objectContaining({
          start: 64,
          size: 64,
          end: 128,
        }),
        expect.objectContaining({
          start: 320,
          size: 192,
          end: 512,
        }),
      ]);
    });

    it('should reserve block of memory #4', () => {
      // Arrange
      const block0 = memory.reserve(32);
      memory.reserve(32);
      const block2 = memory.reserve(64);
      memory.reserve(32);
      const block4 = memory.reserve(128);
      memory.reserve(32);

      memory.free(block0);
      memory.free(block2);
      memory.free(block4);

      // Act
      memory.reserve(32);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 64,
          size: 64,
          end: 128,
        }),
        expect.objectContaining({
          start: 160,
          size: 128,
          end: 288,
        }),

        expect.objectContaining({
          start: 320,
          size: 192,
          end: 512,
        }),
      ]);
    });
    // #endregion

    // #region beginning of free list
    it('should reserve block of memory #5', () => {
      // Act
      const block0 = memory.reserve(64);
      memory.reserve(32);
      const block2 = memory.reserve(32);
      memory.reserve(32);

      memory.free(block0);
      memory.free(block2);

      memory.reserve(48);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 48,
          size: 16,
          end: 64,
        }),

        expect.objectContaining({
          start: 96,
          size: 32,
          end: 128,
        }),

        expect.objectContaining({
          start: 160,
          size: 352,
          end: 512,
        }),
      ]);
    });

    it('should reserve block of memory #6', () => {
      // Act
      const block0 = memory.reserve(32);
      memory.reserve(32);
      const block2 = memory.reserve(32);
      memory.reserve(32);

      memory.free(block0);
      memory.free(block2);

      memory.reserve(32);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 64,
          size: 32,
          end: 96,
        }),

        expect.objectContaining({
          start: 128,
          size: 384,
          end: 512,
        }),
      ]);
    });
    // #endregion

    // #region middle of free list
    it('should reserve block of memory #7', () => {
      // Act
      memory.reserve(32);
      const block1 = memory.reserve(32);
      memory.reserve(32);
      const block3 = memory.reserve(64);
      memory.reserve(32);

      memory.free(block1);
      memory.free(block3);

      memory.reserve(48);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 32,
          size: 32,
          end: 64,
        }),

        expect.objectContaining({
          start: 144,
          size: 16,
          end: 160,
        }),

        expect.objectContaining({
          start: 192,
          size: 320,
          end: 512,
        }),
      ]);
    });

    it('should reserve block of memory #9', () => {
      // Act
      memory.reserve(32);
      const block1 = memory.reserve(32);
      memory.reserve(32);
      const block3 = memory.reserve(64);
      memory.reserve(32);

      memory.free(block1);
      memory.free(block3);

      memory.reserve(64);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 32,
          size: 32,
          end: 64,
        }),

        expect.objectContaining({
          start: 192,
          size: 320,
          end: 512,
        }),
      ]);
    });
    // #endregion

    // #region end of free list
    it('should reserve block of memory #10', () => {
      // Act
      const block0 = memory.reserve(32);
      memory.reserve(32);
      const block2 = memory.reserve(32);
      memory.reserve(32);

      memory.free(block0);
      memory.free(block2);

      memory.reserve(48);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 0,
          size: 32,
          end: 32,
        }),

        expect.objectContaining({
          start: 64,
          size: 32,
          end: 96,
        }),

        expect.objectContaining({
          start: 176,
          size: 336,
          end: 512,
        }),
      ]);
    });

    it('should reserve block of memory #11', () => {
      // Act
      const block0 = memory.reserve(32);
      memory.reserve(32);
      const block2 = memory.reserve(32);
      memory.reserve(32);

      memory.free(block0);
      memory.free(block2);

      memory.reserve(384);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 0,
          size: 32,
          end: 32,
        }),

        expect.objectContaining({
          start: 64,
          size: 32,
          end: 96,
        }),
      ]);
    });
    // #endregion

    it('should reserve block of memory #12', () => {
      // Act
      memory.reserve(memory.size);

      // Assert
      expect(memory.dump()).toEqual([]);
    });
  });

  describe('free', () => {
    it('should free memory #1', () => {
      // Arrange
      const block0 = memory.reserve(32);
      const block1 = memory.reserve(32);
      memory.reserve(32);
      memory.free(block1);

      // Act
      memory.free(block0);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 0,
          size: 64,
          end: 64,
        }),

        expect.objectContaining({
          start: 96,
          size: 416,
          end: 512,
        }),
      ]);
    });

    it('should free memory #2', () => {
      // Arrange
      memory.reserve(32);
      const block1 = memory.reserve(32);
      const block2 = memory.reserve(32);
      memory.reserve(32);

      memory.free(block1);

      // Act
      memory.free(block2);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 32,
          size: 64,
          end: 96,
        }),

        expect.objectContaining({
          start: 128,
          size: 384,
          end: 512,
        }),
      ]);
    });

    it('should free memory #3', () => {
      // Arrange
      memory.reserve(32);
      const block1 = memory.reserve(32);
      const block2 = memory.reserve(32);
      memory.free(block1);

      // Act
      memory.free(block2);

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 32,
          size: 480,
          end: 512,
        }),
      ]);
    });
  });

  describe('clear', () => {
    it('clear memory', () => {
      // Arrange
      const block0 = memory.reserve(32);
      memory.reserve(32);
      const block2 = memory.reserve(32);
      memory.reserve(32);
      const block4 = memory.reserve(32);
      memory.reserve(32);

      memory.free(block0);
      memory.free(block2);
      memory.free(block4);

      // Act
      memory.clear();

      // Assert
      expect(memory.dump()).toEqual([
        expect.objectContaining({
          start: 0,
          size: 512,
          end: 512,
        }),
      ]);
    });
  });
});

import * as csr from 'js-physics-2d/math/csr';

describe('csr', () => {
  beforeEach(() => {});

  describe('compress/decompress', () => {
    it('should compress matrix to CsrMatirx', () => {
      const m = Float32Array.from([
        1.0, 0.0, 0.0, 2.0, 0.0, 3.0, 0.0, 4.0, 5.0, 0.0, 6.0, 0.0, 0.0, 7.0,
        8.0, 0.0,
      ]);

      const expected = {
        m: 4,
        n: 4,
        values: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0],
        columns: [0, 3, 1, 3, 0, 2, 1, 2],
        rows: [0, 2, 4, 6, 8],
      };

      const actual = csr.compress(m, 4, 4);
      expect(actual).toEqual(expected);
    });

    it('should decompress from CsrMatirx', () => {
      const csrm = {
        m: 4,
        n: 4,
        values: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0],
        columns: [0, 3, 1, 3, 0, 2, 1, 2],
        rows: [0, 2, 4, 6, 8],
      };

      const expected = Float32Array.from([
        1.0, 0.0, 0.0, 2.0, 0.0, 3.0, 0.0, 4.0, 5.0, 0.0, 6.0, 0.0, 0.0, 7.0,
        8.0, 0.0,
      ]);

      const actual = csr.decompress(csrm);
      expect(actual).toEqual(expected);
    });
  });

  describe('MxV', () => {
    it('should compute with arbitrary matrix dimensions', () => {
      // Arrange
      let m1x64 = generateRandomVector(1 * 64, 0.5);
      let v64 = generateRandomVector(64, 1.0);
      let m2x32 = generateRandomVector(2 * 32, 0.5);
      let v32 = generateRandomVector(32, 1.0);
      let m4x16 = generateRandomVector(4 * 16, 0.5);
      let v16 = generateRandomVector(16, 1.0);
      let m8x8 = generateRandomVector(8 * 8, 0.5);
      let v8 = generateRandomVector(8, 1.0);
      let m16x4 = generateRandomVector(16 * 4, 0.5);
      let v4 = generateRandomVector(4, 1.0);
      let m32x2 = generateRandomVector(32 * 2, 0.5);
      let v2 = generateRandomVector(2, 1.0);
      let m64x1 = generateRandomVector(64 * 1, 0.5);
      let v1 = generateRandomVector(1, 1.0);

      // Act
      let result1 = new Float32Array(1);
      csr.MxV(result1, csr.compress(m1x64, 1, 64), v64);

      let result2 = new Float32Array(2);
      csr.MxV(result2, csr.compress(m2x32, 2, 32), v32);

      let result4 = new Float32Array(4);
      csr.MxV(result4, csr.compress(m4x16, 4, 16), v16);

      let result8 = new Float32Array(8);
      csr.MxV(result8, csr.compress(m8x8, 8, 8), v8);

      let result16 = new Float32Array(16);
      csr.MxV(result16, csr.compress(m16x4, 16, 4), v4);

      let result32 = new Float32Array(32);
      csr.MxV(result32, csr.compress(m32x2, 32, 2), v2);

      let result64 = new Float32Array(64);
      csr.MxV(result64, csr.compress(m64x1, 64, 1), v1);

      // Assert
      let expected1 = new Float32Array(1);
      MxV(expected1, m1x64, v64);
      expect(result1).toEqual(expected1);

      let expected2 = new Float32Array(2);
      MxV(expected2, m2x32, v32);
      expect(result2).toEqual(expected2);

      let expected4 = new Float32Array(4);
      MxV(expected4, m4x16, v16);
      expect(result4).toEqual(expected4);

      let expected8 = new Float32Array(8);
      MxV(expected8, m8x8, v8);
      expect(result8).toEqual(expected8);

      let expected16 = new Float32Array(16);
      MxV(expected16, m16x4, v4);
      expect(result16).toEqual(expected16);

      let expected32 = new Float32Array(32);
      MxV(expected32, m32x2, v2);
      expect(result32).toEqual(expected32);

      let expected64 = new Float32Array(64);
      MxV(expected64, m64x1, v1);
      expect(result64).toEqual(expected64);
    });

    it('should compute with arbitrary matrix sparcity', () => {
      // Arrange

      let v = generateRandomVector(16, 1.0);
      let m0 = generateRandomVector(4 * 16, 0.0);
      let m2 = generateRandomVector(4 * 16, 0.2);
      let m4 = generateRandomVector(4 * 16, 0.4);
      let m6 = generateRandomVector(4 * 16, 0.6);
      let m8 = generateRandomVector(4 * 16, 0.8);
      let m1 = generateRandomVector(4 * 16, 1.0);

      // Act
      let result0 = new Float32Array(4);
      csr.MxV(result0, csr.compress(m0, 4, 16), v);

      let result2 = new Float32Array(4);
      csr.MxV(result2, csr.compress(m2, 4, 16), v);

      let result4 = new Float32Array(4);
      csr.MxV(result4, csr.compress(m4, 4, 16), v);

      let result6 = new Float32Array(4);
      csr.MxV(result6, csr.compress(m6, 4, 16), v);

      let result8 = new Float32Array(4);
      csr.MxV(result8, csr.compress(m8, 4, 16), v);

      let result1 = new Float32Array(4);
      csr.MxV(result1, csr.compress(m1, 4, 16), v);

      // Assert
      let expected0 = new Float32Array(4);
      MxV(expected0, m0, v);
      expect(result0).toEqual(expected0);

      let expected2 = new Float32Array(4);
      MxV(expected2, m2, v);
      expect(result2).toEqual(expected2);

      let expected4 = new Float32Array(4);
      MxV(expected4, m4, v);
      expect(result4).toEqual(expected4);

      let expected6 = new Float32Array(4);
      MxV(expected6, m6, v);
      expect(result6).toEqual(expected6);

      let expected8 = new Float32Array(4);
      MxV(expected8, m8, v);
      expect(result8).toEqual(expected8);

      let expected1 = new Float32Array(4);
      MxV(expected1, m1, v);
      expect(result1).toEqual(expected1);
    });
  });

  describe('MtxV', () => {
    it('should compute with arbitrary matrix dimensions', () => {
      // Arrange
      let m64x1 = generateRandomVector(64 * 1, 0.5);
      let v64 = generateRandomVector(64, 1.0);
      let m32x2 = generateRandomVector(32 * 2, 0.5);
      let v32 = generateRandomVector(32, 1.0);
      let m16x4 = generateRandomVector(16 * 4, 0.5);
      let v16 = generateRandomVector(16, 1.0);
      let m8x8 = generateRandomVector(8 * 8, 0.5);
      let v8 = generateRandomVector(8, 1.0);
      let m4x16 = generateRandomVector(4 * 16, 0.5);
      let v4 = generateRandomVector(4, 1.0);
      let m2x32 = generateRandomVector(2 * 32, 0.5);
      let v2 = generateRandomVector(2, 1.0);
      let m1x64 = generateRandomVector(1 * 64, 0.5);
      let v1 = generateRandomVector(1, 1.0);

      // Act
      let result1 = new Float32Array(1);
      csr.MtxV(result1, csr.compress(m64x1, 64, 1), v64);

      let result2 = new Float32Array(2);
      csr.MtxV(result2, csr.compress(m32x2, 32, 2), v32);

      let result4 = new Float32Array(4);
      csr.MtxV(result4, csr.compress(m16x4, 16, 4), v16);

      let result8 = new Float32Array(8);
      csr.MtxV(result8, csr.compress(m8x8, 8, 8), v8);

      let result16 = new Float32Array(16);
      csr.MtxV(result16, csr.compress(m4x16, 4, 16), v4);

      let result32 = new Float32Array(32);
      csr.MtxV(result32, csr.compress(m2x32, 2, 32), v2);

      let result64 = new Float32Array(64);
      csr.MtxV(result64, csr.compress(m1x64, 1, 64), v1);

      // Assert
      let expected1 = new Float32Array(1);
      MtxV(expected1, m64x1, v64);
      expect(result1).toEqual(expected1);

      let expected2 = new Float32Array(2);
      MtxV(expected2, m32x2, v32);
      expect(result2).toEqual(expected2);

      let expected4 = new Float32Array(4);
      MtxV(expected4, m16x4, v16);
      expect(result4).toEqual(expected4);

      let expected8 = new Float32Array(8);
      MtxV(expected8, m8x8, v8);
      expect(result8).toEqual(expected8);

      let expected16 = new Float32Array(16);
      MtxV(expected16, m4x16, v4);
      expect(result16).toEqual(expected16);

      let expected32 = new Float32Array(32);
      MtxV(expected32, m2x32, v2);
      expect(result32).toEqual(expected32);

      let expected64 = new Float32Array(64);
      MtxV(expected64, m1x64, v1);
      expect(result64).toEqual(expected64);
    });

    it('should compute with arbitrary matrix sparcity', () => {
      // Arrange
      let v16 = generateRandomVector(16, 1.0);
      let m0 = generateRandomVector(16 * 4, 0.0);
      let m2 = generateRandomVector(16 * 4, 0.2);
      let m4 = generateRandomVector(16 * 4, 0.4);
      let m6 = generateRandomVector(16 * 4, 0.6);
      let m8 = generateRandomVector(16 * 4, 0.8);
      let m1 = generateRandomVector(16 * 4, 1.0);

      // Act
      let result0 = new Float32Array(4);
      csr.MtxV(result0, csr.compress(m0, 16, 4), v16);
      let result2 = new Float32Array(4);
      csr.MtxV(result2, csr.compress(m2, 16, 4), v16);
      let result4 = new Float32Array(4);
      csr.MtxV(result4, csr.compress(m4, 16, 4), v16);
      let result6 = new Float32Array(4);
      csr.MtxV(result6, csr.compress(m6, 16, 4), v16);
      let result8 = new Float32Array(4);
      csr.MtxV(result8, csr.compress(m8, 16, 4), v16);
      let result1 = new Float32Array(4);
      csr.MtxV(result1, csr.compress(m1, 16, 4), v16);

      // Assert
      let expected0 = new Float32Array(4);
      MtxV(expected0, m0, v16);
      expect(result0).toEqual(expected0);

      let expected2 = new Float32Array(4);
      MtxV(expected2, m2, v16);
      expect(result2).toEqual(expected2);

      let expected4 = new Float32Array(4);
      MtxV(expected4, m4, v16);
      expect(result4).toEqual(expected4);

      let expected6 = new Float32Array(4);
      MtxV(expected6, m6, v16);
      expect(result6).toEqual(expected6);

      let expected8 = new Float32Array(4);
      MtxV(expected8, m8, v16);
      expect(result8).toEqual(expected8);

      let expected1 = new Float32Array(4);
      MtxV(expected1, m1, v16);
      expect(result1).toEqual(expected1);
    });
  });
});

const MxV = (out: Float32Array, M: Float32Array, V: Float32Array) => {
  const n = V.length;
  const m = M.length / n;

  for (let i = 0; i < m; i++) {
    out[i] = 0.0;
    for (let j = 0; j < n; j++) {
      out[i] += M[i * n + j] * V[j];
    }
  }
};

const MtxV = (out: Float32Array, M: Float32Array, V: Float32Array) => {
  const n = V.length;
  const m = M.length / n;

  for (let i = 0; i < m; i++) {
    out[i] = 0.0;
    for (let j = 0; j < n; j++) {
      out[i] += M[j * m + i] * V[j];
    }
  }
};

const MxDxMt = (out: Float32Array, J: Float32Array, D: Float32Array) => {
  const n = D.length;
  const c = J.length / n;
  out.fill(0.0);
  for (let i = 0; i < c; i++) {
    for (let j = i; j < c; j++) {
      let v = 0.0;
      for (let k = 0; k < n; k++) {
        v += D[k] * J[i * n + k] * J[j * n + k];
      }
      out[i * c + j] = out[j * c + i] = v;
    }
  }
};

const random = (a: number, b: number, decimals = 2) =>
  Number((Math.random() * (b - a) + a).toFixed(decimals));

const generateRandomVector = (n: number, d = 0.5): Float32Array =>
  Float32Array.from(Array<number>(n)).map(() =>
    random(0.0, 1.0) < d ? random(-16, 16) : 0.0
  );
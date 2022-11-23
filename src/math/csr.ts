// Compressed Sparse Row Matrix
// https://en.wikipedia.org/wiki/Sparse_matrix

import { Vector } from './vector';

export interface Matrix {
  m: number; // rows
  n: number; // columns
  values: ArrayLike<number>;
  columns: ArrayLike<number>;
  rows: ArrayLike<number>;
}

/**
 * Compresses array-based matrix to csr format
 * @param mat the source matrix
 * @param m matrix rows number
 * @param n matrix columns number
 */
export const compress = (mat: Float32Array, m: number, n: number): Matrix => {
  const values = [];
  const columns = [];
  const rows = [];

  let k = 0;
  for (let i = 0; i < m; i++) {
    rows.push(values.length);

    for (let j = 0; j < n; j++) {
      if (mat[k]) {
        values.push(mat[k]);
        columns.push(j);
      }
      k++;
    }
  }

  rows.push(values.length);

  return {
    m,
    n,
    values,
    columns,
    rows,
  };
};

/**
 * Decompresses csr-matrix into raw array form
 * @param csr compressed matrix
 * @returns raw array form of decompressed matrix
 */
export const decompress = (csr: Matrix): Float32Array => {
  const mat = new Float32Array(csr.m * csr.n);
  for (let i = 0; i < csr.m; i++) {
    for (let k = csr.rows[i]; k < csr.rows[i + 1]; k++) {
      mat[i * csr.n + csr.columns[k]] = csr.values[k];
    }
  }
  return mat;
};

export const MxV = (out: Vector, mat: Matrix, vec: Vector) => {
  out.fill(0.0);
  for (let i = 0; i < mat.m; i++) {
    for (let k = mat.rows[i], k1 = mat.rows[i + 1]; k < k1; k++) {
      out[i] += vec[mat.columns[k]] * mat.values[k];
    }
  }
};

export const MxDxMt = (
  mat: Matrix,
  diag: Vector,
  lookup: number[][]
): Matrix => {
  const values = [];
  const columns = [];
  const rows = [0];

  for (let i = 0; i < mat.m; i++) {
    let k0 = mat.rows[i];
    let k1 = mat.rows[i + 1];
    let adjacent = lookup[i];

    for (let j of adjacent) {
      let val = 0.0;
      let k = k0;
      let kt = mat.rows[j];

      let kt1 = mat.rows[j + 1];

      while (k < k1 && kt < kt1) {
        if (mat.columns[kt] < mat.columns[k]) {
          kt++;
        } else if (mat.columns[kt] > mat.columns[k]) {
          k++;
        } else {
          val += diag[mat.columns[k]] * mat.values[k] * mat.values[kt];
          kt++;
          k++;
        }
      }

      if (val) {
        values.push(val);
        columns.push(j);
      }
    }

    rows.push(values.length);
  }

  return {
    m: mat.m,
    n: mat.m,
    values,
    columns,
    rows,
  };
};

export const MtxV = (out: Vector, mat: Matrix, vec: Vector) => {
  out.fill(0.0);

  for (let i = 0; i < mat.m; i++) {
    for (let k = mat.rows[i], k1 = mat.rows[i + 1]; k < k1; k++) {
      out[mat.columns[k]] += vec[i] * mat.values[k];
    }
  }
};

export const projectedGaussSeidel = (
  out: Vector,
  A: Matrix,
  b: Vector,
  min: Vector,
  max: Vector,
  maxIterations: number
) => {
  const n = b.length;

  while (maxIterations-- > 0) {
    for (let j = 0; j < n; j++) {
      out[j] = b[j];

      let denom = 1.0;
      for (let k = A.rows[j], k1 = A.rows[j + 1]; k < k1; k++) {
        const c = A.columns[k];
        const v = A.values[k];

        if (c === j) {
          denom = v;
          continue;
        }

        out[j] -= v * out[c];
      }

      out[j] /= denom;
      out[j] = Math.min(out[j], max[j]);
      out[j] = Math.max(out[j], min[j]);
    }
  }
};

// Compressed Sparse Row Matrix
// https://en.wikipedia.org/wiki/Sparse_matrix

import { Body } from '.';

export namespace csr {
  export interface Matrix {
    m: number; // rows
    n: number; // columns
    values: ArrayLike<number>;
    columns: ArrayLike<number>;
    rows: ArrayLike<number>;
  }

  class LinkedNode<T> {
    prev: LinkedNode<T> | null;
    next: LinkedNode<T> | null;

    constructor(public readonly value: T) {
      this.prev = this.next = null;
    }

    insertBefore(node: LinkedNode<T>) {
      if (node) {
        this.next = node;
        this.prev = node.prev;

        if (node.prev) {
          node.prev.next = this;
        }
        node.prev = this;
      }
    }

    insertAfter(node: LinkedNode<T>) {
      if (node) {
        this.prev = node;
        this.next = node.next;

        if (node.next) {
          node.next.prev = this;
        }
        node.next = this;
      }
    }
  }

  /**
   * Compresses array-based matrix to csr format
   * @param mat the source matrix
   * @param m matrix rows number
   */
  export const compress = (mat: Float32Array, m: number): Matrix => {
    const values = [];
    const columns = [];
    const rows = [];

    const n = mat.length / m;
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

  export const MxV = (out: Float32Array, mat: Matrix, vec: Float32Array) => {
    out.fill(0.0);
    for (let i = 0; i < mat.m; i++) {
      for (let k = mat.rows[i], k1 = mat.rows[i + 1]; k < k1; k++) {
        out[i] += vec[mat.columns[k]] * mat.values[k];
      }
    }
  };

  export const MxDxMtCsr = (
    mat: Matrix,
    diag: Float32Array,
    hintA: Uint32Array,
    hintB: Uint32Array
  ): Matrix => {
    type MatrixEntry = { row: number; col: number; val: number };

    const diagonal = new Array<LinkedNode<MatrixEntry>>(mat.m);
    let last: LinkedNode<MatrixEntry> = null;
    for (let i = 0; i < mat.m; i++) {
      let val = 0.0;
      for (let k0 = mat.rows[i], k1 = mat.rows[i + 1]; k0 < k1; k0++) {
        val += diag[mat.columns[k0]] * mat.values[k0] * mat.values[k0];
      }
      const node = new LinkedNode({ row: i, col: i, val });
      node.insertAfter(last);
      diagonal[i] = node;
      last = node;
    }

    const m1 = mat.m - 1;
    for (let i = 0; i < mat.m; i++) {
      let k0 = mat.rows[i];
      let k1 = mat.rows[i + 1];

      const indexA = hintA[i];
      const indexB = hintB[i];

      for (let j = m1; j > i; j--) {
        if (
          indexA === hintA[j] ||
          indexB === hintB[j] ||
          indexA === hintB[j] ||
          indexB === hintA[j]
        ) {
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
            new LinkedNode({ row: i, col: j, val }).insertAfter(diagonal[i]);
            new LinkedNode({ row: j, col: i, val }).insertBefore(diagonal[j]);
          }
        }
      }
    }

    const values = [];
    const columns = [];
    const rows = [];
    let lastRow = -1;
    let counter = 0;
    for (let p = diagonal[0]; p !== null; p = p.next) {
      const { row, col, val } = p.value;
      if (lastRow !== row) {
        while (lastRow < row) {
          rows.push(counter);
          lastRow++;
        }
      }
      values.push(val);
      columns.push(col);
      lastRow = row;
      counter++;
    }

    rows.push(counter);

    return {
      m: mat.m,
      n: mat.m,
      values,
      columns,
      rows,
    };
  };

  export const MtxV = (out: Float32Array, mat: Matrix, vec: Float32Array) => {
    out.fill(0.0);

    for (let i = 0; i < mat.m; i++) {
      for (let k = mat.rows[i], k1 = mat.rows[i + 1]; k < k1; k++) {
        out[mat.columns[k]] += vec[i] * mat.values[k];
      }
    }
  };
}

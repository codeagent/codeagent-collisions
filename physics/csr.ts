// Compressed Sparse Row Matrix
// https://en.wikipedia.org/wiki/Sparse_matrix

export namespace csr {
  export interface Matrix {
    m: number; // rows
    n: number; // columns
    values: Float32Array;
    columns: Uint16Array;
    rows: Uint16Array;
  }

  export const compress = (mat: Float32Array, m: number): Matrix => {
    const values = [];
    const columns = [];
    const rows = [];

    const n = mat.length / m;

    let counter = 0;
    for (let i = 0; i < mat.length; i++) {
      if (i % n === 0) {
        rows.push(counter);
      }

      if (mat[i]) {
        values.push(mat[i]);
        columns.push(i % n);
        counter++;
      }
    }
    rows.push(counter);

    return {
      m,
      n,
      values: Float32Array.from(values),
      columns: Uint16Array.from(columns),
      rows: Uint16Array.from(rows)
    };
  };

  export const decompress = (csr: Matrix): Float32Array => {
    const n = csr.n;
    const mat = new Float32Array(csr.m * csr.n);

    for (let k = 0; k < csr.values.length; k++) {
      let i = 0,
        j = csr.columns[k];
      while (csr.rows[i] <= k) {
        i++;
      }
      i--;
      mat[i * n + j] = csr.values[k];
    }
    return mat;
  };

  export const MxV = (out: Float32Array, mat: Matrix, vec: Float32Array) => {
    out.fill(0.0);
    for (let i = 0; i < mat.m; i++) {
      for (let k = mat.rows[i]; k < mat.rows[i + 1]; k++) {
        out[i] += vec[mat.columns[k]] * mat.values[k];
      }
    }
  };

  export const MxMt = (out: Float32Array, mat: Matrix) => {
    out.fill(0.0);

    for (let i = 0; i < mat.m; i++) {
      for (let j = i; j < mat.m; j++) {
        let v = 0.0;

        let k = mat.rows[i];
        let kt = mat.rows[j];

        while (k < mat.rows[i + 1] && kt < mat.rows[j + 1]) {
          if (mat.columns[kt] < mat.columns[k]) {
            kt++;
          } else if (mat.columns[kt] > mat.columns[k]) {
            k++;
          } else {
            v += mat.values[k] * mat.values[kt];
            kt++;
            k++;
          }
        }

        out[j * mat.m + i] = out[i * mat.m + j] = v;
      }
    }
  };

  export const MxDxMt = (
    out: Float32Array,
    mat: Matrix,
    diag: Float32Array
  ) => {
    out.fill(0.0);

    for (let i = 0; i < mat.m; i++) {
      for (let j = i; j < mat.m; j++) {
        let v = 0.0;
        let k = mat.rows[i];
        let kt = mat.rows[j];

        while (k < mat.rows[i + 1] && kt < mat.rows[j + 1]) {
          if (mat.columns[kt] < mat.columns[k]) {
            kt++;
          } else if (mat.columns[kt] > mat.columns[k]) {
            k++;
          } else {
            v += diag[mat.columns[k]] * mat.values[k] * mat.values[kt];
            kt++;
            k++;
          }
        }

        out[j * mat.m + i] = out[i * mat.m + j] = v;
      }
    }
  };

  export const MtxV = (out: Float32Array, mat: Matrix, vec: Float32Array) => {
    out.fill(0.0);

    for (let i = 0; i < mat.m; i++) {
      for (let k = mat.rows[i]; k < mat.rows[i + 1]; k++) {
        out[mat.columns[k]] += vec[i] * mat.values[k];
      }
    }
  };
}

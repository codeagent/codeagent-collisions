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

  const row = new Float32Array(1024);

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
      rows: Uint16Array.from(rows),
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

  export const MxMtCsr = (mat: Matrix): Matrix => {
    const countIndex = new Map<number, number>(); // row:count
    const columnsIndex = new Map<number, number[]>(); // row:columns
    const valuesIndex = new Map<number, number[]>(); // row:values

    // init indices
    for (let i = 0; i < mat.m; i++) {
      columnsIndex.set(i, []);
      countIndex.set(i, 0);
      valuesIndex.set(i, []);
    }

    let count = 0;
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

        //
        if (v) {
          count++;
          countIndex.set(i, countIndex.get(i) + 1);
          columnsIndex.get(i).push(j);
          valuesIndex.get(i).push(v);

          if (i !== j) {
            count++;
            countIndex.set(j, countIndex.get(j) + 1);
            columnsIndex.get(j).push(i);
            valuesIndex.get(j).push(v);
          }
        }
      }
    }

    const rows = new Uint16Array(mat.m + 1);
    const columns = new Uint16Array(count);
    const values = new Float32Array(count);

    let counter = 0;
    let cOffset = 0;
    let vOffset = 0;
    for (let i = 0; i < mat.m; i++) {
      counter += countIndex.get(i);
      rows[i + 1] = counter;
      columns.set(columnsIndex.get(i), cOffset);
      values.set(valuesIndex.get(i), vOffset);
      cOffset += columnsIndex.get(i).length;
      vOffset += valuesIndex.get(i).length;
    }

    return {
      m: mat.m,
      n: mat.m,
      rows,
      columns,
      values,
    };
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

  export const MxDxMtCsrOld = (mat: Matrix, diag: Float32Array): Matrix => {
    const countIndex = new Map<number, number>(); // row:count
    const columnsIndex = new Map<number, number[]>(); // row:columns
    const valuesIndex = new Map<number, number[]>(); // row:values

    // init indices
    for (let i = 0; i < mat.m; i++) {
      columnsIndex.set(i, []);
      countIndex.set(i, 0);
      valuesIndex.set(i, []);
    }

    let count = 0;
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

        //
        if (v) {
          count++;
          countIndex.set(i, countIndex.get(i) + 1);
          columnsIndex.get(i).push(j);
          valuesIndex.get(i).push(v);

          if (i !== j) {
            count++;
            countIndex.set(j, countIndex.get(j) + 1);
            columnsIndex.get(j).push(i);
            valuesIndex.get(j).push(v);
          }
        }
      }
    }

    const rows = new Uint16Array(mat.m + 1);
    const columns = new Uint16Array(count);
    const values = new Float32Array(count);

    let counter = 0;
    let cOffset = 0;
    let vOffset = 0;
    for (let i = 0; i < mat.m; i++) {
      counter += countIndex.get(i);
      rows[i + 1] = counter;
      columns.set(columnsIndex.get(i), cOffset);
      values.set(valuesIndex.get(i), vOffset);
      cOffset += columnsIndex.get(i).length;
      vOffset += valuesIndex.get(i).length;
    }

    return {
      m: mat.m,
      n: mat.m,
      rows,
      columns,
      values,
    };
  };
  export const MxDxMtCsr = (mat: Matrix, diag: Float32Array): Matrix => {
    const values = [];
    const columns = [];
    const rows = [];

    const row = new Float32Array(mat.n);

    rows.push(0);
    for (let j = 0; j < mat.m; j++) {
      row.fill(0);

      for (let k = mat.rows[j]; k < mat.rows[j + 1]; k++) {
        row[mat.columns[k]] = mat.values[k] * diag[mat.columns[k]];
      }

      for (let i = 0; i < mat.m; i++) {
        let v = 0;
        for (let k = mat.rows[i]; k < mat.rows[i + 1]; k++) {
          v += row[mat.columns[k]] * mat.values[k];
        }
        if (v) {
          values.push(v);
          columns.push(i);
        }
      }
      rows.push(values.length);
    }

    return {
      m: mat.m,
      n: mat.m,
      values: Float32Array.from(values),
      columns: Uint16Array.from(columns),
      rows: Uint16Array.from(rows),
    };
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

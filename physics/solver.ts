import { csr } from './csr';

export type Vector = Float32Array;
export type Matrix = Float32Array;

export const MxV = (out: Vector, M: Matrix, V: Vector) => {
  const n = V.length;
  const m = M.length / n;

  for (let i = 0; i < m; i++) {
    out[i] = 0.0;
    for (let j = 0; j < n; j++) {
      out[i] += M[i * n + j] * V[j];
    }
  }
};

export const VxV = (V1: Vector, V2: Vector): number => {
  let dot = 0.0;
  for (let j = 0; j < V1.length; j++) {
    dot += V1[j] * V2[j];
  }
  return dot;
};

export const MtxV = (out: Vector, M: Matrix, V: Vector) => {
  const n = V.length;
  const m = M.length / n;

  for (let i = 0; i < m; i++) {
    out[i] = 0.0;
    for (let j = 0; j < n; j++) {
      out[i] += M[j * m + i] * V[j];
    }
  }
};

export const JxDxJt = (out: Matrix, J: Matrix, D: Vector) => {
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

export const VmV = (out: Vector, V1: Vector, V2: Vector, length: number) => {
  for (let i = 0; i < length; i++) {
    out[i] = V1[i] * V2[i];
  }
};

export const VpVxS = (
  out: Vector,
  V1: Vector,
  V2: Vector,
  S: number,
  length: number
) => {
  for (let i = 0; i < length; i++) {
    out[i] = V1[i] + V2[i] * S;
  }
};

export const VpV = (out: Vector, V1: Vector, V2: Vector, length: number) => {
  for (let i = 0; i < length; i++) {
    out[i] = V1[i] + V2[i];
  }
};

export const VxSpVxS = (
  out: Vector,
  V1: Vector,
  S1: number,
  V2: Vector,
  S2: number,
  length: number
) => {
  for (let i = 0; i < length; i++) {
    out[i] = V1[i] * S1 + V2[i] * S2;
  }
};

export const projectedGaussSeidel = (
  out: Vector,
  A: csr.Matrix,
  b: Vector,
  initialGuess: Vector,
  cMin: Vector,
  cMax: Vector,
  maxIterations: number
) => {
  const n = b.length;

  out.set(initialGuess, 0);

  while (maxIterations-- > 0) {
    for (let j = 0; j < n; j++) {
      out[j] = b[j];
      let denom = 1.0;

      for (let k = A.rows[j]; k < A.rows[j + 1]; k++) {
        if (A.columns[k] === j) {
          denom = A.values[k];
          continue;
        }
        out[j] -= A.values[k] * out[A.columns[k]];
      }

      out[j] /= denom;
      out[j] = Math.min(out[j], cMax[j]);
      out[j] = Math.max(out[j], cMin[j]);
    }
  }
};

export const VcV = (out: Vector, from: Vector) => {
  out.set(from, 0);
};

export const debugVector = (v: Vector) => {
  console.table(v);
};

export const debugMatrix = (mat: Matrix, cols: number) => {
  const rows = mat.reduce(
    (acc, v, i) => (
      i % cols === 0 ? acc.push([v]) : acc[acc.length - 1].push(v), acc
    ),
    []
  );
  console.table(rows);
};

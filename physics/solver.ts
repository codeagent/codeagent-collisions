export type Vector = Float32Array;
export type Matrix = Float32Array;

export const D = (out: Matrix, elements: Vector) => {
  const n = elements.length;
  for (let i = 0; i < n; i++) {
    out[i * n + i] = elements[i];
  }
};

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

export const JxDxJt = (out: Matrix, J: Matrix, D: Matrix) => {
  const n = Math.sqrt(D.length);
  const c = J.length / n;

  for (let i = 0; i < c; i++) {
    for (let j = i; j < c; j++) {
      let v = 0.0;
      for (let k = 0; k < n; k++) {
        v += D[k * n + k] * J[i * n + k] * J[j * n + k];
      }
      out[i * c + j] = out[j * c + i] = v;
    }
  }
};

export const DxV = (out: Vector, D: Matrix, V: Vector) => {
  const n = out.length;
  for (let j = 0; j < n; j++) {
    out[j] = V[j] * D[j * n + j];
  }
};

export const VmV = (out: Vector, V1: Vector, V2: Vector) => {
  const n = out.length;
  for (let i = 0; i < n; i++) {
    out[i] = V1[i] * V2[i];
  }
};

export const VpVxS = (out: Vector, V1: Vector, V2: Vector, S: number) => {
  const n = out.length;
  for (let i = 0; i < n; i++) {
    out[i] = V1[i] + V2[i] * S;
  }
};

export const VpV = (out: Vector, V1: Vector, V2: Vector) => {
  const n = out.length;
  for (let i = 0; i < n; i++) {
    out[i] = V1[i] + V2[i];
  }
};

export const VxSpVxS = (
  out: Vector,
  V1: Vector,
  S1: number,
  V2: Vector,
  S2: number
) => {
  const n = out.length;
  for (let i = 0; i < n; i++) {
    out[i] = V1[i] * S1 + V2[i] * S2;
  }
};

export const projectedGussSeidel = (
  out: Vector,
  A: Matrix,
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
      for (let i = 0; i < out.length; i++) {
        if (i === j) {
          continue;
        }
        out[j] -= A[n * j + i] * out[i];
      }

      if (Math.abs(A[n * j + j]) <= 1e-2) {
        continue;
      }

      out[j] /= A[n * j + j];
      out[j] = Math.min(out[j], cMax[j]);
      out[j] = Math.max(out[j], cMin[j]);
    }
  }
};

export const VcV = (out: Vector, from: Vector) => {
  out.set(from, 0);
};

export const removeRange = (
  out: Vector,
  from: Vector,
  start: number,
  len: number,
  n: number
) => {
  let i = start;
  while (i < n - len) {
    out[i] = from[i + len];
    i++;
  }
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

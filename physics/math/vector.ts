export type Vector = Float32Array;

export const VxV = (V1: Vector, V2: Vector): number => {
  let dot = 0.0;
  for (let j = 0; j < V1.length; j++) {
    dot += V1[j] * V2[j];
  }
  return dot;
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

export const VcV = (out: Vector, from: Vector) => {
  out.set(from, 0);
};

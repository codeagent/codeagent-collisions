export type Vector = Float32Array;

export const VxV = (V1: Vector, V2: Vector): number => {
  let dot = 0.0;
  for (let j = 0, length = V1.length; j < length; j++) {
    dot += V1[j] * V2[j];
  }
  return dot;
};

export const VmV = (out: Vector, V1: Vector, V2: Vector) => {
  for (let i = 0, length = out.length; i < length; i++) {
    out[i] = V1[i] * V2[i];
  }
};

export const VpVxS = (out: Vector, V1: Vector, V2: Vector, S: number) => {
  for (let i = 0, length = out.length; i < length; i++) {
    out[i] = V1[i] + V2[i] * S;
  }
};

export const VpV = (out: Vector, V1: Vector, V2: Vector) => {
  for (let i = 0, length = out.length; i < length; i++) {
    out[i] = V1[i] + V2[i];
  }
};

export const negate = (out: Vector, V: Vector) => {
  for (let i = 0, length = out.length; i < length; i++) {
    out[i] = -V[i];
  }
};

export const VxSpVxS = (
  out: Vector,
  V1: Vector,
  S1: number,
  V2: Vector,
  S2: number
) => {
  for (let i = 0, length = out.length; i < length; i++) {
    out[i] = V1[i] * S1 + V2[i] * S2;
  }
};

export const VcV = (out: Vector, from: Vector) => {
  out.set(from, 0);
};

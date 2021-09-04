import { mat3, vec2 } from 'gl-matrix';

export const affineInverse = (out: mat3, m: mat3): mat3 => {
  return mat3.set(
    out,

    m[0],
    m[3],
    0.0,

    m[1],
    m[4],
    0.0,

    -m[0] * m[6] - m[3] * m[7],
    -m[1] * m[6] - m[4] * m[7],
    1.0
  );
};

export const closestPointToLineSegment = (
  out: vec2,
  a: vec2,
  b: vec2,
  p: vec2
): vec2 => {
  const ab = vec2.sub(vec2.create(), b, a);
  const ap = vec2.sub(vec2.create(), p, a);

  // Project c onto ab, computing parameterized position d(t)=a+ t*(b – a)
  let t = vec2.dot(ap, ab) / vec2.dot(ab, ab);

  if (t < 0.0) {
    vec2.copy(out, a);
  } else if (t > 1.0) {
    vec2.copy(out, b);
  } else {
    vec2.copy(out, a);
    return vec2.scaleAndAdd(out, a, ab, t);
  }
};

export const transformMat3Vec = (out: vec2, v: vec2, m: mat3) =>
  vec2.set(out, m[0] * v[0] + m[3] * v[1], m[1] * v[0] + m[4] * v[1]);

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

    -m[0] * m[6] - m[1] * m[7],
    -m[3] * m[6] - m[4] * m[7],
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

export const getPolygonSignedArea = (polygon: vec2[]): number => {
  let area: number = 0.0;
  for (let i = 0; i < polygon.length; i++) {
    const p0 = polygon[i];
    const p1 = polygon[(i + 1) % polygon.length];
    area += p0[0] * p1[1] - p1[0] * p0[1];
  }
  return 0.5 * area;
};

export const getPolygonCentroid = (polygon: vec2[]): vec2 => {
  let cx = 0.0;
  let cy = 0.0;
  for (let i = 0; i < polygon.length; i++) {
    const p0 = polygon[i];
    const p1 = polygon[(i + 1) % polygon.length];
    const cross = p0[0] * p1[1] - p1[0] * p0[1];
    cx += (p0[0] + p1[0]) * cross;
    cy += (p0[1] + p1[1]) * cross;
  }

  const area = 1.0 / 6.0 / getPolygonSignedArea(polygon);
  return vec2.fromValues(area * cx, area * cy);
};

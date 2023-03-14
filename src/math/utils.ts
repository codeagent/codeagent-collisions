import { mat3, vec2, vec3 } from 'gl-matrix';

const ab = vec2.create();
const ac = vec2.create();
const ad = vec2.create();
const ap = vec2.create();
const bc = vec2.create();
const bp = vec2.create();
const c0 = vec2.create();
const c1 = vec2.create();
const c2 = vec2.create();
const c3 = vec2.create();
const ca = vec2.create();
const cb = vec2.create();
const cd = vec2.create();
const cp = vec2.create();

export const ORIGIN: Readonly<vec2> = vec2.create();

export const cross = (a: Readonly<vec2>, b: Readonly<vec2>): number =>
  a[0] * b[1] - a[1] * b[0];

export const affineInverse = (out: mat3, m: Readonly<mat3>): mat3 => {
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
  a: Readonly<vec2>,
  b: Readonly<vec2>,
  p: Readonly<vec2>
): vec2 => {
  vec2.sub(ab, b, a);
  vec2.sub(ap, p, a);

  // Project c onto ab, computing parameterized position d(t)=a+ t*(b – a)
  let t = vec2.dot(ap, ab) / vec2.dot(ab, ab);

  // If outside segment, clamp t (and therefore d) to the closest endpoint
  if (t < 0.0) {
    t = 0.0;
  }
  if (t > 1.0) {
    t = 1.0;
  }

  return vec2.set(out, 1.0 - t, t);
};

export const closestPointsBetweenLineSegments = (
  out0: vec2,
  out1: vec2,
  p0: Readonly<vec2>,
  p1: Readonly<vec2>,
  q0: Readonly<vec2>,
  q1: Readonly<vec2>
): void => {
  vec2.sub(ab, p1, p0);

  const ab2 = vec2.dot(ab, ab);

  vec2.sub(ac, q0, p0);
  vec2.sub(ad, q1, p0);
  vec2.sub(cd, q1, q0);

  const cd2 = vec2.dot(cd, cd);

  vec2.sub(ca, p0, q0);
  vec2.sub(cb, p1, q0);

  const t0 = Math.max(0, Math.min(1, vec2.dot(ab, ac) / ab2));
  const t1 = Math.max(0, Math.min(1, vec2.dot(ab, ad) / ab2));
  const t2 = Math.max(0, Math.min(1, vec2.dot(cd, ca) / cd2));
  const t3 = Math.max(0, Math.min(1, vec2.dot(cd, cb) / cd2));

  vec2.scaleAndAdd(c0, p0, ab, t0);
  vec2.scaleAndAdd(c1, p0, ab, t1);
  vec2.scaleAndAdd(c2, q0, cd, t2);
  vec2.scaleAndAdd(c3, q0, cd, t3);

  let min = Number.POSITIVE_INFINITY;

  for (const [f, s] of [
    [c0, q0],
    [c1, q1],
    [p0, c2],
    [p1, c3],
  ]) {
    const dist = vec2.sqrDist(f, s);
    if (dist < min) {
      vec2.copy(out0, f);
      vec2.copy(out1, s);
      min = dist;
    }
  }
};

export const sqDistanceToLineSegment = (
  a: Readonly<vec2>,
  b: Readonly<vec2>,
  p: Readonly<vec2>
): number => {
  vec2.sub(ab, b, a);
  vec2.sub(ap, p, a);

  // Project p onto ab, computing parameterized position d(t)=a+ t*(b – a)
  let t = vec2.dot(ap, ab) / vec2.dot(ab, ab);

  // If outside segment, clamp t (and therefore d) to the closest endpoint
  if (t < 0.0) {
    t = 0.0;
  }

  if (t > 1.0) {
    t = 1.0;
  }

  vec2.scaleAndAdd(c0, a, ab, t);

  return vec2.sqrDist(p, c0);
};

export const closestPointToTriangle = (
  out: vec3,
  a: Readonly<vec2>,
  b: Readonly<vec2>,
  c: Readonly<vec2>,
  p: Readonly<vec2>
): vec3 => {
  vec2.subtract(ab, b, a);
  vec2.subtract(ac, c, a);
  vec2.subtract(bc, c, b);
  vec2.subtract(ap, p, a);
  vec2.subtract(bp, p, b);
  vec2.subtract(cp, p, c);

  // Compute parametric position s for projection P’ of P on AB,
  // P’ = A + s*AB, s = snom/(snom+sdenom)
  const snom = vec2.dot(ap, ab);
  const sdenom = -vec2.dot(bp, ab);

  // Compute parametric position t for projection P’ of P on AC,
  // P’ = A + t*AC, s = tnom/(tnom+tdenom)
  const tnom = vec2.dot(ap, ac);
  const tdenom = -vec2.dot(cp, ac);
  if (snom <= 0.0 && tnom <= 0.0) {
    return vec3.set(out, 1.0, 0.0, 0.0); // Vertex region early out
  }
  // Compute parametric position u for projection P’ of P on BC,
  // P’ = B + u*BC, u = unom/(unom+udenom)
  const unom = vec2.dot(bp, bc);
  const udenom = -vec2.dot(cp, bc);
  if (sdenom <= 0.0 && unom <= 0.0) {
    return vec3.set(out, 0.0, 1.0, 0.0); // Vertex region early out
  }

  if (tdenom <= 0.0 && udenom <= 0.0) {
    return vec3.set(out, 0.0, 0.0, 1.0); // Vertex region early out
  }

  // P is outside (or on) AB if the triple scalar product [N PA PB] <= 0
  const n = cross(ab, ac);
  const vc = n * cross(ap, bp);

  // If P outside AB and within feature region of AB,
  // return projection of P onto AB
  if (vc <= 0.0 && snom >= 0.0 && sdenom >= 0.0) {
    const t = snom / (snom + sdenom);
    return vec3.set(out, 1.0 - t, t, 0.0);
  }

  // P is outside (or on) BC if the triple scalar product [N PB PC] <= 0
  const va = n * cross(bp, cp);

  // If P outside BC and within feature region of BC,
  // return projection of P onto BC
  if (va <= 0.0 && unom >= 0.0 && udenom >= 0.0) {
    const t = unom / (unom + udenom);
    return vec3.set(out, 0.0, 1.0 - t, t);
  }

  // P is outside (or on) CA if the triple scalar product [N PC PA] <= 0
  const vb = n * cross(cp, ap);

  // If P outside CA and within feature region of CA,
  // return projection of P onto CA
  if (vb <= 0.0 && tnom >= 0.0 && tdenom >= 0.0) {
    const t = tnom / (tnom + tdenom);
    return vec3.set(out, 1.0 - t, 0.0, t);
  }

  // P must project inside face region. Compute Q using barycentric coordinates
  const u = va / (va + vb + vc);
  const v = vb / (va + vb + vc);
  const w = 1.0 - u - v; // = vc / (va + vb + vc)

  return vec3.set(out, u, v, w);
};

export const fromBarycentric = <T extends ArrayLike<number>>(
  out: vec2,
  barycentric: T,
  ...points: Readonly<vec2>[]
): vec2 => {
  vec2.set(out, 0.0, 0.0);

  for (let i = 0, len = barycentric.length; i < len; i++) {
    vec2.scaleAndAdd(out, out, points[i], barycentric[i]);
  }

  return out;
};

export const transformMat3Vec = (
  out: vec2,
  v: Readonly<vec2>,
  m: Readonly<mat3>
): vec2 => vec2.set(out, m[0] * v[0] + m[3] * v[1], m[1] * v[0] + m[4] * v[1]);

export const getPolygonSignedArea = (polygon: Readonly<vec2[]>): number => {
  let area = 0.0;
  for (let i = 0, len = polygon.length; i < len; i++) {
    const p0 = polygon[i];
    const p1 = polygon[(i + 1) % polygon.length];
    area += p0[0] * p1[1] - p1[0] * p0[1];
  }
  return 0.5 * area;
};

export const getPolygonCentroid = (
  polygon: Readonly<vec2[]>,
  area: number
): vec2 => {
  let cx = 0.0;
  let cy = 0.0;
  for (let i = 0, len = polygon.length; i < len; i++) {
    const p0 = polygon[i];
    const p1 = polygon[(i + 1) % polygon.length];
    const cross = p0[0] * p1[1] - p1[0] * p0[1];
    cx += (p0[0] + p1[0]) * cross;
    cy += (p0[1] + p1[1]) * cross;
  }

  area = 1.0 / 6.0 / area;
  return vec2.fromValues(area * cx, area * cy);
};

export const clipByPlane = (
  p0: vec2,
  p1: Readonly<vec2>,
  normal: Readonly<vec2>,
  origin: Readonly<vec2>
): vec2 => {
  vec2.sub(c0, origin, p0);
  vec2.sub(c1, p1, p0);
  let t = vec2.dot(c0, normal) / vec2.dot(c1, normal);
  t = Math.max(0, Math.min(1, t));
  return vec2.scaleAndAdd(p0, p0, c1, t);
};

export namespace Line {
  const p = vec3.create();

  export const create = (): vec3 => {
    return vec3.fromValues(1.0, 0.0, 0.0);
  };

  export const set = (
    out: vec3,
    normal: Readonly<vec2>,
    point: Readonly<vec2>
  ): vec3 => {
    return vec3.set(out, normal[0], normal[1], -vec2.dot(normal, point));
  };

  export const distance = (
    line: Readonly<vec3>,
    point: Readonly<vec2>
  ): number => {
    return vec3.dot(line, vec3.set(p, point[0], point[1], 1));
  };
}

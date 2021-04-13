import { mat3, vec2, vec3 } from "gl-matrix";

export type Shape = vec2[];
export type AABB = [vec2, vec2];

export interface ContactManifoldContactPoint {
  point: vec2;
  normal: vec2;
  depth: number;
  index: number;
}
export type ContactManifold = ContactManifoldContactPoint[];
export type LineSegment = [vec2, vec2];
export type LineLineIntersection = [number, number];

export const cross = (a: vec2, b: vec2): number => a[0] * b[1] - b[0] * a[1];

export const testShapePoint = (shape: Shape, transform: mat3, point: vec2) => {
  const e = vec2.create();
  const p = vec2.create();
  const v0 = vec2.create();
  const v1 = vec2.create();
  const x = vec3.create();

  for (let i = 0; i < shape.length; i++) {
    if (i === 0) {
      vec2.transformMat3(v0, shape[i], transform);
    }
    vec2.transformMat3(v1, shape[(i + 1) % shape.length], transform);
    vec2.sub(e, v1, v0);
    vec2.sub(p, point, v0);
    vec2.cross(x, p, e);

    if (x[2] > 0) {
      return false;
    }

    vec2.copy(v0, v1);
  }

  return true;
};

export const testLineLine = (
  lineA: LineSegment,
  lineB: LineSegment
): LineLineIntersection => {
  const r = vec2.fromValues(
    lineA[1][0] - lineA[0][0],
    lineA[1][1] - lineA[0][1]
  );
  const p = vec2.clone(lineA[0]);
  const s = vec2.fromValues(
    lineB[1][0] - lineB[0][0],
    lineB[1][1] - lineB[0][1]
  );
  const q = vec2.clone(lineB[0]);

  // t = (q − p) × s / (r × s)
  // u = (q − p) × r / (r × s)
  vec2.sub(q, q, p);
  const denom = cross(r, s);

  return [cross(q, s) / denom, cross(q, r) / denom];
};

export const testAABBAABB = (aabb1: AABB, aabb2: AABB) =>
  aabb2[0][0] < aabb1[1][0] &&
  aabb2[1][0] > aabb1[0][0] &&
  aabb2[0][1] < aabb1[1][1] &&
  aabb2[1][1] > aabb1[0][1];

const areIntesect = (intersection: LineLineIntersection) =>
  intersection[0] >= 0 &&
  intersection[0] <= 1.0 &&
  intersection[1] >= 0.0 &&
  intersection[1] <= 1.0;

const projectionToLine = (line: LineSegment, point: vec2): vec2 => {
  const d = vec2.fromValues(line[1][0] - line[0][0], line[1][1] - line[0][1]);
  const p = vec2.sub(vec2.create(), point, line[0]);
  const proj = vec2.dot(p, d) / vec2.squaredLength(d);
  return vec2.scaleAndAdd(vec2.create(), line[0], d, proj);
};

export const getContactManifold = (
  shapeA: Shape,
  transformA: mat3,
  shapeB: Shape,
  transformB: mat3
): ContactManifold => {
  const e = vec2.create();
  const p = vec2.create();
  const x = vec3.create();

  const centerA = vec2.create();
  vec2.transformMat3(centerA, p, transformA);

  const centerB = vec2.create();
  vec2.transformMat3(centerB, p, transformB);

  const pointsA: vec2[] = shapeA.map(p =>
    vec2.transformMat3(vec2.create(), p, transformA)
  );
  const pointsB: vec2[] = shapeB.map(p =>
    vec2.transformMat3(vec2.create(), p, transformB)
  );

  const manifold: ContactManifold = [];

  for (let j of [0, 1]) {
    const leftPoints = j == 0 ? pointsB : pointsA;
    const center = j == 0 ? centerB : centerA;
    const rightPoints = j == 0 ? pointsA : pointsB;

    for (let k = 0; k < leftPoints.length; k++) {
      let i;
      for (i = 0; i < rightPoints.length; i++) {
        vec2.sub(e, rightPoints[(i + 1) % rightPoints.length], rightPoints[i]);
        vec2.sub(p, leftPoints[k], rightPoints[i]);
        vec2.cross(x, p, e);

        if (x[2] > 0) {
          break;
        }
      }

      if (i !== rightPoints.length) {
        continue;
      }

      const testP = leftPoints[k];
      const segmentA: LineSegment = [
        vec2.fromValues(testP[0], testP[1]),
        center
      ];

      let minDistance = Number.POSITIVE_INFINITY;
      let minProj = vec2.create();
      let minNormal = vec2.create();

      for (i = 0; i < rightPoints.length; i++) {
        const segmentB: LineSegment = [
          rightPoints[(i + 1) % rightPoints.length],
          rightPoints[i]
        ];
        const intersection = testLineLine(segmentA, segmentB);
        if (!areIntesect(intersection)) {
          continue;
        }

        const proj = projectionToLine(segmentB, testP);
        const dist = vec2.dist(proj, testP);
        if (dist < minDistance) {
          minProj = proj;
          minDistance = dist;
          vec2.sub(minNormal, segmentB[1], segmentB[0]);
          vec2.normalize(minNormal, minNormal);
          vec2.set(minNormal, -minNormal[1], minNormal[0]);
        }
      }

      if (Number.isFinite(minDistance)) {
        manifold.push({
          point: vec2.fromValues(minProj[0], minProj[1]),
          normal: vec2.fromValues(minNormal[0], minNormal[1]),
          depth: minDistance,
          index: j
        });
      }
    }
  }

  return manifold;
};

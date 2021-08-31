import { mat2, mat3, vec2 } from 'gl-matrix';
import { MTV } from './mtv';
import { ShapeProxy } from './proxy';
import { Polygon } from './shape';

export interface ContactPoint {
  point: vec2;
  normal: vec2;
  depth: number;
  index: 0 | 1;
}
export type ContactManifold = ContactPoint[];

const getIncidentFace = (mtv: MTV, incident: ShapeProxy<Polygon>): number => {
  const toIncidentMat = mat2.create();
  mat2.set(
    toIncidentMat,
    incident.transformable.transform[0],
    incident.transformable.transform[3],
    incident.transformable.transform[1],
    incident.transformable.transform[4]
  );

  const dir = vec2.clone(mtv.vector);
  vec2.negate(dir, dir);
  vec2.transformMat2(dir, dir, toIncidentMat);

  let bestDot = Number.NEGATIVE_INFINITY;
  let bestPoint = 0;
  const length = incident.shape.points.length;
  for (let i = 0; i < length; i++) {
    const dot = vec2.dot(incident.shape.points[i], dir);
    if (dot > bestDot) {
      bestDot = dot;
      bestPoint = i;
    }
  }

  const i0 = (bestPoint - 1 + length) % length;
  const n0 = incident.shape.normals[i0];
  const n1 = incident.shape.normals[bestPoint];

  if (vec2.dot(dir, n0) > vec2.dot(dir, n1)) {
    return i0;
  } else {
    return bestPoint;
  }
};

const clipByPlane = (p0: vec2, p1: vec2, n: vec2, o: vec2) => {
  const a = vec2.create();
  const b = vec2.create();
  vec2.sub(a, o, p0);
  vec2.sub(b, p1, p0);
  let t = vec2.dot(a, n) / vec2.dot(b, n);
  if (t > 0.0 && t < 1.0) {
    vec2.scaleAndAdd(p0, p0, b, t);
  }
};

export const getPolyPolyContactManifold = (
  out: ContactManifold,
  mtv: MTV,
  poly0: ShapeProxy<Polygon>,
  poly1: ShapeProxy<Polygon>
): ContactManifold => {
  const reference = [poly0, poly1][mtv.shapeIndex];
  const incident = [poly1, poly0][mtv.shapeIndex];

  const incidentToRreferenceMat = mat3.create();
  mat3.invert(incidentToRreferenceMat, reference.transformable.transform);
  mat3.multiply(
    incidentToRreferenceMat,
    incidentToRreferenceMat,
    incident.transformable.transform
  );

  const ref0 = reference.shape.points[mtv.faceIndex];
  const ref1 =
    reference.shape.points[(mtv.faceIndex + 1) % reference.shape.points.length];

  const incI = getIncidentFace(mtv, incident);
  const inc0 = vec2.clone(incident.shape.points[incI]);
  const inc1 = vec2.clone(
    incident.shape.points[(incI + 1) % incident.shape.points.length]
  );
  vec2.transformMat3(inc0, inc0, incidentToRreferenceMat);
  vec2.transformMat3(inc1, inc1, incidentToRreferenceMat);

  // cliping
  const refN = vec2.create();
  vec2.sub(refN, ref1, ref0);
  clipByPlane(inc0, inc1, refN, ref0);
  vec2.negate(refN, refN);
  clipByPlane(inc1, inc0, refN, ref1);

  out.length = 0;

  const n = reference.shape.normals[mtv.faceIndex];
  for (let c of [inc0, inc1]) {
    vec2.sub(refN, c, ref0);
    const depth = vec2.dot(refN, n);
    if (depth < 0) {
      const point = vec2.create();
      vec2.transformMat3(point, c, reference.transformable.transform);
      const normal = mtv.vector;
      const index = mtv.shapeIndex;
      out.push({
        point,
        normal,
        depth,
        index: index as 0 | 1
      });
    }
  }

  return out;
};

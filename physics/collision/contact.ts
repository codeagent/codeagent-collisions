import { vec2 } from 'gl-matrix';
import { SpaceMappingInterface, inverse } from './space-mapping';
import { MTV } from './mtv';
import { Shape, Circle, Polygon } from './shape';
import { closestPointToLineSegment } from './utils';

export interface ContactPoint {
  shape0: Shape;
  shape1: Shape;
  point0: vec2;
  localPoint0: vec2;
  point1: vec2;
  localPoint1: vec2;
  normal: vec2; // from point0 at point1
  depth: number;
}
export type ContactManifold = ContactPoint[];

const getIncidentFace = (
  mtv: MTV,
  incident: Polygon,
  spaceMapping: SpaceMappingInterface
): number => {
  const dir = vec2.clone(mtv.vector);
  vec2.negate(dir, dir);
  spaceMapping.toSecondVector(dir, dir); // to incident space

  const length = incident.points.length;
  let bestPoint = incident.indexOfFarhestPoint(dir);

  const i0 = (bestPoint - 1 + length) % length;
  const n0 = incident.normals[i0];
  const n1 = incident.normals[bestPoint];

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
  poly0: Polygon,
  poly1: Polygon,
  spaceMapping: SpaceMappingInterface
): ContactManifold => {
  let reference: Polygon;
  let incident: Polygon;

  if (mtv.shapeIndex === 0) {
    reference = poly0;
    incident = poly1;
  } else {
    reference = poly1;
    incident = poly0;
    spaceMapping = inverse(spaceMapping); // first=reference second=incident
  }

  const ref0 = reference.points[mtv.faceIndex];
  const ref1 = reference.points[(mtv.faceIndex + 1) % reference.points.length];

  const incI = getIncidentFace(mtv, incident, spaceMapping);
  const inc0 = vec2.clone(incident.points[incI]);
  const inc1 = vec2.clone(incident.points[(incI + 1) % incident.points.length]);
  spaceMapping.fromSecondToFirstPoint(inc0, inc0); // from incident to reference
  spaceMapping.fromSecondToFirstPoint(inc1, inc1); // from incident to reference

  // cliping
  const refN = vec2.create();
  vec2.sub(refN, ref0, ref1);
  clipByPlane(inc0, inc1, refN, ref1);
  vec2.negate(refN, refN);
  clipByPlane(inc1, inc0, refN, ref0);

  out.length = 0;

  const n = reference.normals[mtv.faceIndex];
  for (let contact of [inc0, inc1]) {
    vec2.sub(refN, contact, ref0);
    const depth = vec2.dot(refN, n);
    if (depth >= 0) {
      continue;
    }

    const normal = vec2.clone(mtv.vector);
    vec2.negate(normal, normal);

    const point1 = vec2.create();
    spaceMapping.fromFirstPoint(point1, contact);

    const point0 = vec2.create();
    vec2.scaleAndAdd(point0, point1, normal, depth);

    const localPoint1 = vec2.clone(point1);
    spaceMapping.toSecondPoint(localPoint1, localPoint1);

    out.push({
      shape0: reference,
      shape1: incident,
      point0,
      localPoint0: vec2.clone(contact),
      point1,
      localPoint1,
      normal,
      depth: -depth
    });
  }

  return out;
};

export const getPolyCircleContactManifold = (
  out: ContactManifold,
  mtv: MTV,
  poly: Polygon,
  circle: Circle,
  spaceMapping: SpaceMappingInterface
): ContactManifold => {
  const p0 = vec2.clone(poly.points[mtv.faceIndex]);
  spaceMapping.fromFirstPoint(p0, p0);

  const p1 = vec2.clone(poly.points[(mtv.faceIndex + 1) % poly.points.length]);
  spaceMapping.fromFirstPoint(p1, p1);

  const center = vec2.create();
  spaceMapping.fromSecondPoint(center, center);

  const point0 = vec2.create();
  closestPointToLineSegment(point0, p0, p1, center);

  const point1 = vec2.create();
  vec2.scaleAndAdd(point1, point0, mtv.vector, mtv.depth);

  const localPoint0 = vec2.create();
  spaceMapping.toFirstPoint(localPoint0, point0);

  const localPoint1 = vec2.create();
  spaceMapping.toSecondPoint(localPoint1, point1);

  out.length = 0;
  out.push({
    shape0: poly,
    shape1: circle,
    point0,
    localPoint0,
    point1,
    localPoint1,
    normal: mtv.vector,
    depth: mtv.depth
  });

  return out;
};

export const getCircleCircleContactManifold = (
  out: ContactManifold,
  mtv: MTV,
  circle0: Circle,
  circle1: Circle,
  spaceMapping: SpaceMappingInterface
): ContactManifold => {
  const center0 = vec2.create();
  spaceMapping.fromFirstPoint(center0, center0);

  const center1 = vec2.create();
  spaceMapping.fromSecondPoint(center1, center1);

  const point0 = vec2.create();
  vec2.scaleAndAdd(point0, center0, mtv.vector, -circle0.radius);

  const point1 = vec2.create();
  vec2.scaleAndAdd(point1, center1, mtv.vector, circle1.radius);

  const localPoint0 = vec2.create();
  spaceMapping.toFirstPoint(localPoint0, point0);

  const localPoint1 = vec2.create();
  spaceMapping.toSecondPoint(localPoint1, point1);

  out.length = 0;
  out.push({
    shape0: circle0,
    shape1: circle1,
    point0,
    localPoint0,
    point1,
    localPoint1,
    normal: mtv.vector,
    depth: mtv.depth
  });

  return out;
};

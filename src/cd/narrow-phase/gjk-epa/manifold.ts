import { vec2 } from 'gl-matrix';

import { Circle, Polygon, Edge } from '../../shape';
import {
  SpaceMappingInterface,
  inverse,
  closestPointToLineSegment,
  clipByPlane,
  fromBarycentric,
} from '../../../math';

import { ContactInfo } from '../../contact';
import { Collider } from '../../collider';

const inc0 = vec2.create();
const inc1 = vec2.create();
const refN = vec2.create();
const dir = vec2.create();
const p0 = vec2.create();
const p1 = vec2.create();
const b = vec2.create();
const c0 = vec2.create();
const c1 = vec2.create();

const queryBestEdge = (
  polygon: Readonly<Polygon>,
  normal: Readonly<vec2>
): Edge => {
  let curr = polygon.edgeLoop;
  let best = vec2.dot(curr.normal, normal);

  if (vec2.dot(curr.next.normal, normal) > best) {
    curr = curr.next;

    while (vec2.dot(curr.next.normal, normal) > vec2.dot(curr.normal, normal)) {
      curr = curr.next;
    }
  } else if (vec2.dot(curr.prev.normal, normal) > best) {
    curr = curr.prev;

    while (vec2.dot(curr.prev.normal, normal) > vec2.dot(curr.normal, normal)) {
      curr = curr.prev;
    }
  }

  return curr;
};

export const getPolyPolyContactManifold = (
  out: ContactInfo[],
  collider0: Readonly<Collider>,
  poly0: Readonly<Polygon>,
  collider1: Readonly<Collider>,
  poly1: Readonly<Polygon>,
  spaceMapping: SpaceMappingInterface,
  mtv: Readonly<vec2>
): ContactInfo[] => {
  const normal = vec2.create();
  vec2.normalize(normal, mtv);
  vec2.copy(dir, normal);

  spaceMapping.toSecondVector(dir, dir);
  let incident = queryBestEdge(poly1, dir);
  let incDot = vec2.dot(incident.normal, dir);

  vec2.negate(dir, normal);

  spaceMapping.toFirstVector(dir, dir);
  let reference = queryBestEdge(poly0, dir);
  let refDot = vec2.dot(reference.normal, dir);

  let inverted = false;

  if (incDot > refDot) {
    let tmp = incident;
    incident = reference;
    reference = tmp;
    spaceMapping = inverse(spaceMapping);
    vec2.negate(normal, normal);
    inverted = true;
  }

  // cliping
  spaceMapping.fromSecondToFirstPoint(inc0, incident.v0.point);
  spaceMapping.fromSecondToFirstPoint(inc1, incident.v1.point);

  vec2.sub(refN, reference.v0.point, reference.v1.point);
  clipByPlane(inc0, inc1, refN, reference.v1.point);

  vec2.negate(refN, refN);
  clipByPlane(inc1, inc0, refN, reference.v0.point);

  out.length = 0;

  for (let contact of [inc0, inc1]) {
    vec2.sub(refN, contact, reference.v0.point);
    const depth = vec2.dot(refN, reference.normal);
    if (depth >= 0) {
      continue;
    }

    const point1 = vec2.create();
    spaceMapping.fromFirstPoint(point1, contact);

    const point0 = vec2.create();
    vec2.scaleAndAdd(point0, point1, normal, depth);

    const localPoint1 = vec2.create();
    spaceMapping.toSecondPoint(localPoint1, point1);

    const localPoint0 = vec2.create();
    spaceMapping.toFirstPoint(localPoint0, point0);

    out.push({
      collider0: inverted ? collider1 : collider0,
      collider1: inverted ? collider0 : collider1,
      shape0: poly0,
      shape1: poly1,
      point0,
      localPoint0,
      point1,
      localPoint1,
      normal,
      depth: -depth,
    });
  }

  return out;
};

export const getPolyCircleContactManifold = (
  out: ContactInfo[],
  collider0: Readonly<Collider>,
  poly: Readonly<Polygon>,
  collider1: Readonly<Collider>,
  circle: Readonly<Circle>,
  spaceMapping: SpaceMappingInterface,
  mtv: Readonly<vec2>
): ContactInfo[] => {
  const normal = vec2.create();
  vec2.normalize(normal, mtv);
  vec2.copy(dir, normal);

  spaceMapping.toFirstVector(dir, dir);
  vec2.negate(dir, dir);
  let edge = queryBestEdge(poly, dir);

  spaceMapping.fromFirstPoint(p0, edge.v0.point);
  spaceMapping.fromFirstPoint(p1, edge.v1.point);

  vec2.zero(c0);
  spaceMapping.fromSecondPoint(c0, c0);

  const point0 = vec2.create();
  closestPointToLineSegment(b, p0, p1, c0);
  fromBarycentric(point0, b, p0, p1);

  const point1 = vec2.create();
  vec2.add(point1, point0, mtv);

  vec2.copy(dir, normal);
  spaceMapping.toSecondVector(dir, dir);
  circle.support(point1, dir);
  spaceMapping.fromSecondPoint(point1, point1);

  const depth = vec2.distance(point0, point1);

  const localPoint0 = vec2.create();
  spaceMapping.toFirstPoint(localPoint0, point0);

  const localPoint1 = vec2.create();
  spaceMapping.toSecondPoint(localPoint1, point1);

  out.length = 0;

  out.push({
    collider0,
    collider1,
    shape0: poly,
    shape1: circle,
    point0,
    localPoint0,
    point1,
    localPoint1,
    normal,
    depth,
  });

  return out;
};

export const getCircleCircleContactManifold = (
  out: ContactInfo[],
  collider0: Readonly<Collider>,
  circle0: Readonly<Circle>,
  collider1: Readonly<Collider>,
  circle1: Readonly<Circle>,
  spaceMapping: SpaceMappingInterface,
  mtv: Readonly<vec2>
): ContactInfo[] => {
  const normal = vec2.clone(mtv);
  vec2.normalize(normal, normal);
  vec2.negate(normal, normal);

  vec2.zero(c0);
  spaceMapping.fromFirstPoint(c0, c0);

  vec2.zero(c1);
  spaceMapping.fromSecondPoint(c1, c1);

  const point0 = vec2.create();
  vec2.scaleAndAdd(point0, c0, normal, circle0.radius);

  const point1 = vec2.create();
  vec2.scaleAndAdd(point1, c1, normal, -circle1.radius);

  const depth = vec2.distance(point0, point1);

  const localPoint0 = vec2.create();
  spaceMapping.toFirstPoint(localPoint0, point0);

  const localPoint1 = vec2.create();
  spaceMapping.toSecondPoint(localPoint1, point1);

  out.length = 0;

  out.push({
    collider0,
    collider1,
    shape0: circle0,
    shape1: circle1,
    point0,
    localPoint0,
    point1,
    localPoint1,
    normal,
    depth,
  });

  return out;
};

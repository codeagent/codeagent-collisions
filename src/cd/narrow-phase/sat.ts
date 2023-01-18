import { vec2 } from 'gl-matrix';

import {
  inverse,
  SpaceMappingInterface,
  closestPointToLineSegment,
  fromBarycentric,
  clipByPlane,
} from '../../math';
import { Circle, Convex, Edge, Polygon, Vertex } from '../shape';

// --
class BestEdgeVertexQuery {
  public edge: Edge = null; // reference edge
  public vertex: Vertex = null; // incident vertex
  public depth: number = Number.NEGATIVE_INFINITY;
}

class BestEdgeQuery {
  public edge: Edge = null;
  public depth: number = Number.NEGATIVE_INFINITY;
}

const dir = vec2.create();
const support = vec2.create();
const p0 = vec2.create();
const p1 = vec2.create();
const c0 = vec2.create();
const c1 = vec2.create();
const bary = vec2.create();
const point0 = vec2.create();
const inc0 = vec2.create();
const inc1 = vec2.create();
const normal = vec2.create();
const evQuery0 = new BestEdgeVertexQuery();
const evQuery1 = new BestEdgeVertexQuery();
const beQuery = new BestEdgeQuery();

const queryBestEdgeVertex = (
  query: BestEdgeVertexQuery,
  reference: Readonly<Polygon>,
  incident: Readonly<Polygon>,
  spaceMapping: SpaceMappingInterface
): BestEdgeVertexQuery => {
  query.depth = Number.NEGATIVE_INFINITY;
  query.edge = null;
  query.vertex = null;

  for (const edge of reference.edges()) {
    vec2.negate(dir, edge.normal);
    spaceMapping.fromFirstToSecondVector(dir, dir);

    incident.support(support, dir);
    spaceMapping.fromSecondToFirstPoint(support, support);

    vec2.sub(support, support, edge.v0.point);
    const proj = vec2.dot(edge.normal, support);
    if (proj >= 0) {
      // separating axis was found - early exit
      query.depth = proj;
      query.edge = edge;
      query.vertex = incident.cachedSupportVertex;
      return query;
    } else {
      if (proj > query.depth) {
        query.depth = proj;
        query.edge = edge;
        query.vertex = incident.cachedSupportVertex;
      }
    }
  }

  return query;
};

const queryBestEdge = (
  query: BestEdgeQuery,
  polygon: Readonly<Polygon>,
  shape: Readonly<Convex>,
  spaceMapping: SpaceMappingInterface
): BestEdgeQuery => {
  query.depth = Number.NEGATIVE_INFINITY;
  query.edge = null;

  for (const edge of polygon.edges()) {
    vec2.negate(dir, edge.normal);
    spaceMapping.fromFirstToSecondVector(dir, dir);

    shape.support(support, dir);
    spaceMapping.fromSecondToFirstPoint(support, support);

    vec2.sub(support, support, edge.v0.point);
    const proj = vec2.dot(edge.normal, support);
    if (proj >= 0) {
      // separating axis was found - early exit
      query.depth = proj;
      query.edge = edge;

      return query;
    } else {
      if (proj > query.depth) {
        query.depth = proj;
        query.edge = edge;
      }
    }
  }

  return query;
};

export class ContactPoint {
  public readonly point0 = vec2.create();
  public readonly point1 = vec2.create();
  public readonly normal = vec2.create();
  public depth = 0;
}

export const testPolyPoly = (
  out: ContactPoint[],
  poly0: Readonly<Polygon>,
  poly1: Readonly<Polygon>,
  spaceMapping: SpaceMappingInterface
): boolean => {
  out.length = null;

  queryBestEdgeVertex(evQuery0, poly0, poly1, spaceMapping);

  if (evQuery0.depth >= 0) {
    return false;
  }

  const invSpaceMapping = inverse(spaceMapping);
  queryBestEdgeVertex(evQuery1, poly1, poly0, invSpaceMapping);

  if (evQuery1.depth >= 0) {
    return false;
  }

  let minQuery: BestEdgeVertexQuery = evQuery0;
  let inverted = false;

  if (evQuery1.depth > evQuery0.depth) {
    minQuery = evQuery1;
    spaceMapping = invSpaceMapping;
    inverted = true;
  }

  const reference = minQuery.edge;
  spaceMapping.fromFirstToSecondVector(normal, reference.normal);
  const incident =
    vec2.dot(minQuery.vertex.edge0.normal, normal) <
    vec2.dot(minQuery.vertex.edge1.normal, normal)
      ? minQuery.vertex.edge0
      : minQuery.vertex.edge1;

  spaceMapping.fromSecondToFirstPoint(inc0, incident.v0.point);
  spaceMapping.fromSecondToFirstPoint(inc1, incident.v1.point);

  // clipping
  vec2.sub(normal, reference.v0.point, reference.v1.point);
  clipByPlane(inc0, inc1, normal, reference.v1.point);

  vec2.negate(normal, normal);
  clipByPlane(inc1, inc0, normal, reference.v0.point);

  for (const contact of [inc0, inc1]) {
    vec2.sub(normal, contact, reference.v0.point);
    const depth = vec2.dot(normal, reference.normal);
    if (depth >= 0) {
      continue;
    }

    const contactPoint = new ContactPoint();
    spaceMapping.fromFirstVector(contactPoint.normal, reference.normal);
    contactPoint.depth = -depth;

    if (inverted) {
      spaceMapping.fromFirstPoint(contactPoint.point0, contact);
      vec2.copy(contactPoint.normal, contactPoint.normal);
      vec2.scaleAndAdd(
        contactPoint.point1,
        contactPoint.point0,
        contactPoint.normal,
        contactPoint.depth
      );
    } else {
      spaceMapping.fromFirstPoint(contactPoint.point1, contact);
      vec2.negate(contactPoint.normal, contactPoint.normal);
      vec2.scaleAndAdd(
        contactPoint.point0,
        contactPoint.point1,
        contactPoint.normal,
        -contactPoint.depth
      );
    }

    out.push(contactPoint);
  }

  return true;
};

export const testPolyCircle = (
  out: ContactPoint[],
  poly: Readonly<Polygon>,
  circle: Readonly<Circle>,
  spaceMapping: SpaceMappingInterface
): boolean => {
  out.length = null;

  queryBestEdge(beQuery, poly, circle, spaceMapping);

  if (beQuery.depth >= 0) {
    return false;
  }

  spaceMapping.fromFirstPoint(p0, beQuery.edge.v0.point);
  spaceMapping.fromFirstPoint(p1, beQuery.edge.v1.point);

  vec2.zero(c0);
  spaceMapping.fromSecondPoint(c0, c0);

  closestPointToLineSegment(bary, p0, p1, c0);
  fromBarycentric(point0, bary, p0, p1);

  vec2.sub(normal, point0, c0);
  const distance = vec2.length(normal);

  if (distance < circle.radius) {
    const contactPoint = new ContactPoint();
    contactPoint.depth = circle.radius - distance;
    vec2.normalize(contactPoint.normal, normal);
    vec2.copy(contactPoint.point0, point0);
    vec2.scaleAndAdd(
      contactPoint.point1,
      point0,
      contactPoint.normal,
      contactPoint.depth
    );

    out.push(contactPoint);

    return true;
  }

  return false;
};

export const testCircleCircle = (
  out: ContactPoint[],
  circle0: Readonly<Circle>,
  circle1: Readonly<Circle>,
  spaceMapping: Readonly<SpaceMappingInterface>
): boolean => {
  vec2.zero(c0);
  spaceMapping.fromFirstPoint(c0, c0);

  vec2.zero(c1);
  spaceMapping.fromSecondPoint(c1, c1);

  const depth = circle0.radius + circle1.radius - vec2.distance(c0, c1);

  if (depth <= 0) {
    return false;
  }

  const contactPoint = new ContactPoint();
  contactPoint.depth = depth;
  vec2.subtract(contactPoint.normal, c0, c1);
  vec2.normalize(contactPoint.normal, contactPoint.normal);
  vec2.scaleAndAdd(
    contactPoint.point0,
    c0,
    contactPoint.normal,
    -circle0.radius
  );
  vec2.scaleAndAdd(
    contactPoint.point1,
    c1,
    contactPoint.normal,
    circle1.radius
  );

  out.push(contactPoint);

  return true;
};

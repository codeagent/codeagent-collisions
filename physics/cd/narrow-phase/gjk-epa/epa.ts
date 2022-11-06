import { vec2 } from 'gl-matrix';

import { Convex } from '../../../cd';
import {
  closestPointToLineSegment,
  ORIGIN,
  fromBarycentric,
  SpaceMappingInterface,
} from '../../../math';
import { PriorityQueue } from './priority-queue';
import { support } from './support';

class Edge {
  public readonly closest = vec2.create();
  public readonly closestBarycentric = vec2.create();
  public distance = 0;

  constructor(
    public readonly p0: Readonly<vec2>,
    public readonly p1: Readonly<vec2>
  ) {}
}

type Polytope = PriorityQueue<Edge>;

const createTirangle = (
  w0: Readonly<vec2>,
  w1: Readonly<vec2>,
  w2: Readonly<vec2>
): Polytope => {
  const edge0 = new Edge(w0, w1);
  const edge1 = new Edge(w1, w2);
  const edge2 = new Edge(w2, w0);

  const polytope = new PriorityQueue<Edge>(
    (a: Edge, b: Edge) => a.distance - b.distance
  );

  for (const edge of [edge0, edge1, edge2]) {
    closestPointToLineSegment(
      edge.closestBarycentric,
      edge.p0,
      edge.p1,
      ORIGIN
    );
    fromBarycentric(edge.closest, edge.closestBarycentric, edge.p0, edge.p1);
    edge.distance = vec2.dot(edge.closest, edge.closest);
    polytope.enqueue(edge);
  }

  return polytope;
};

const createQuadrilateral = (
  w1: Readonly<vec2>,
  w3: Readonly<vec2>,
  shape0: Readonly<Convex>,
  shape1: Readonly<Convex>,
  spaceMapping: Readonly<SpaceMappingInterface>,
  margin = 0
): Polytope => {
  const dir = vec2.create();
  vec2.subtract(dir, w3, w1);
  vec2.set(dir, -dir[1], dir[0]);

  const w0 = vec2.create();
  support(w0, shape0, shape1, spaceMapping, dir, margin);

  vec2.negate(dir, dir);
  const w2 = vec2.create();
  support(w2, shape0, shape1, spaceMapping, dir, margin);

  const edge0 = new Edge(w0, w1);
  const edge1 = new Edge(w1, w2);
  const edge2 = new Edge(w2, w3);
  const edge3 = new Edge(w3, w0);

  const polytope = new PriorityQueue<Edge>(
    (a: Edge, b: Edge) => a.distance - b.distance
  );

  for (const edge of [edge0, edge1, edge2, edge3]) {
    closestPointToLineSegment(
      edge.closestBarycentric,
      edge.p0,
      edge.p1,
      ORIGIN
    );
    fromBarycentric(edge.closest, edge.closestBarycentric, edge.p0, edge.p1);
    edge.distance = vec2.dot(edge.closest, edge.closest);
    polytope.enqueue(edge);
  }

  return polytope;
};

export const epa = (
  mtv: vec2,
  simplex: Readonly<Set<vec2>>,
  shape0: Readonly<Convex>,
  shape1: Readonly<Convex>,
  spaceMapping: Readonly<SpaceMappingInterface>,
  margin = 0,
  epsilon = 1.0e-4,
  maxIterations = 25
): void => {
  let polytope: Polytope = null;
  if (simplex.size === 3) {
    const [w0, w1, w2] = Array.from(simplex);
    polytope = createTirangle(w0, w1, w2);
  } else if (simplex.size === 2) {
    const [w0, w1] = Array.from(simplex);
    polytope = createQuadrilateral(
      w0,
      w1,
      shape0,
      shape1,
      spaceMapping,
      margin
    );
  } else {
    // throw new Error('epa: wrong simplex ');
    vec2.zero(mtv);
    return;
  }

  let edge: Edge = null;
  let lowerBound = 0;
  let upperBound = 0;

  while (maxIterations-- && polytope.size) {
    const entry = polytope.dequeue();

    if (
      entry.closestBarycentric[0] < 1.0e-6 ||
      entry.closestBarycentric[1] < 1.0e-6
    ) {
      // never will be approached as closest. Put at the end of queue
      // edge.distance = Number.MAX_VALUE;
      // polytope.enqueue(edge);
      continue;
    }

    edge = entry;

    const s = vec2.create();
    support(s, shape0, shape1, spaceMapping, edge.closest, margin);

    lowerBound = vec2.dot(edge.closest, edge.closest);
    upperBound = vec2.dot(edge.closest, s);

    if (upperBound - lowerBound < epsilon) {
      break;
    }

    const edge0 = new Edge(edge.p0, s);
    const edge1 = new Edge(s, edge.p1);

    for (const edge of [edge0, edge1]) {
      closestPointToLineSegment(
        edge.closestBarycentric,
        edge.p0,
        edge.p1,
        ORIGIN
      );
      fromBarycentric(edge.closest, edge.closestBarycentric, edge.p0, edge.p1);
      edge.distance = vec2.dot(edge.closest, edge.closest);
      polytope.enqueue(edge);
    }
  }

  if (edge) {
    fromBarycentric(mtv, edge.closestBarycentric, edge.p0, edge.p1);
  } else {
    vec2.zero(mtv);
  }
};

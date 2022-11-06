import { vec2 } from 'gl-matrix';
import { cross } from '../../math';

class Edge {
  constructor(public readonly p0: vec2, public readonly p1: vec2) {}
}

export const getUnique = (set: Set<vec2>, soup: Readonly<Iterable<vec2>>) => {
  const uniqueMap = new Map<string, vec2>();
  for (const point of soup) {
    const key = point.toString();
    if (!uniqueMap.has(key)) {
      set.add(point);
      uniqueMap.set(key, point);
    }
  }
};

export const getConvexHull = (
  hull: Array<vec2>,
  soup: Readonly<Iterable<vec2>>
) => {
  interface StackEntry {
    edge: Edge;
    points: Set<vec2>;
  }

  // Calc aabb
  let left = vec2.fromValues(Number.POSITIVE_INFINITY, 0);
  let top = vec2.fromValues(0, Number.NEGATIVE_INFINITY);
  let right = vec2.fromValues(Number.NEGATIVE_INFINITY, 0);
  let bottom = vec2.fromValues(0, Number.POSITIVE_INFINITY);

  const points = new Set<vec2>();

  for (const point of soup) {
    if (point[0] < left[0]) {
      left = point;
    }

    if (point[1] > top[1]) {
      top = point;
    }

    if (point[0] > right[0]) {
      right = point;
    }

    if (point[1] < bottom[1]) {
      bottom = point;
    }

    points.add(point);
  }

  const edges: Edge[] = [];
  const list = [left, bottom, right, top];
  for (let i = 0; i < list.length; i++) {
    const p0 = list[i];
    const p1 = list[(i + 1) % list.length];

    if (p0 !== p1) {
      edges.push(new Edge(p0, p1));
    }
  }

  const p = vec2.create();
  const e = vec2.create();

  const queue: Array<StackEntry> = [];

  for (const edge of edges) {
    const set = new Set<vec2>();

    for (const point of points) {
      vec2.sub(p, point, edge.p0);
      vec2.sub(e, edge.p1, edge.p0);

      if (cross(p, e) > 0) {
        set.add(point);
      }
    }

    queue.push({ points: set, edge });
  }

  while (queue.length) {
    const { edge, points: collection } = queue.pop();
    if (collection.size === 0) {
      hull.push(edge.p0);
    } else {
      // find most distant point from edge
      let farthest: vec2 = null;
      let maxDistance = 0;
      for (const point of collection) {
        vec2.sub(p, point, edge.p0);
        vec2.sub(e, edge.p1, edge.p0);
        vec2.scale(e, e, vec2.dot(p, e) / vec2.dot(e, e));
        vec2.sub(p, p, e);

        const distance = vec2.squaredLength(p);
        if (distance > maxDistance) {
          maxDistance = distance;
          farthest = point;
        }
      }

      if (farthest !== null) {
        // find two point sets
        const left = new Edge(farthest, edge.p1);
        const right = new Edge(edge.p0, farthest);

        for (const edge of [right, left]) {
          const set = new Set<vec2>();

          for (const point of collection) {
            vec2.sub(p, point, edge.p0);
            vec2.sub(e, edge.p1, edge.p0);

            if (cross(p, e) > 0) {
              set.add(point);
            }
          }

          queue.push({ points: set, edge });
        }
      }
    }
  }
};

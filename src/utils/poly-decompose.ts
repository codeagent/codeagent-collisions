import { vec2 } from 'gl-matrix';

import { Loop, Mesh, Vertex } from '../cd';
import { Line } from '../math';

import { PriorityQueue } from './priority-queue';

export const findLoops = (mesh: Readonly<Mesh>): Vertex[] => {
  const lookup = new Map<string, [vec2, vec2]>();

  for (const triangle of mesh) {
    const edges: [vec2, vec2][] = [
      [triangle.p0, triangle.p1],
      [triangle.p1, triangle.p2],
      [triangle.p2, triangle.p0],
    ];

    for (const edge of edges) {
      const invId = `${vec2.str(edge[1])}-${vec2.str(edge[0])}`;

      if (lookup.has(invId)) {
        lookup.delete(invId);
      } else {
        const id = `${vec2.str(edge[0])}-${vec2.str(edge[1])}`;
        lookup.set(id, edge);
      }
    }
  }

  const loops: Vertex[] = [];
  let loop: vec2[] = null;

  while (lookup.size > 0) {
    if (loop === null) {
      for (const [id, edge] of lookup) {
        loop = [...edge];
        lookup.delete(id);
        break;
      }
    } else {
      let found = 0;

      for (const [id, edge] of lookup) {
        if (vec2.equals(loop[loop.length - 1], edge[0])) {
          loop.push(edge[1]);
          lookup.delete(id);
          found++;
        } else if (vec2.equals(edge[1], loop[0])) {
          loop.unshift(edge[0]);
          lookup.delete(id);
          found++;
        }

        if (found === 2) {
          break;
        }
      }

      if (found === 0) {
        loops.push(Loop.from(loop.slice(0, -1)));
        loop = null;
      }
    }
  }

  if (loop) {
    loops.push(Loop.from(loop.slice(0, -1)));
  }

  return loops;
};

export const decomposeLoop = (loop: Vertex): Vertex[] => {
  if (Loop.isConvex(loop)) {
    return [loop];
  }

  const line0 = Line.create();
  const line1 = Line.create();
  const normal = vec2.create();
  const polygons: Vertex[] = [];
  const query = new Loop.RayCastQuery();
  const queue = new PriorityQueue<Vertex>(
    (a, b) => Loop.angle(b) - Loop.angle(a)
  );

  for (const vertex of Loop.of(loop)) {
    if (Loop.isReflex(vertex)) {
      queue.enqueue(vertex);
    }
  }

  while (queue.size) {
    const reflex = queue.dequeue();

    // viewing cone
    Line.set(line0, reflex.edge0.normal, reflex.point);
    Line.set(line1, reflex.edge1.normal, reflex.point);

    // list of visible vervices ordered by distance from current reflex vertex
    const candidates: Vertex[] = [];

    for (const vertex of Loop.of(reflex)) {
      // if in viewing cone and is visble
      if (
        vertex !== reflex.prev &&
        vertex !== reflex &&
        vertex !== reflex.next &&
        Line.distance(line0, vertex.point) < 0 &&
        Line.distance(line1, vertex.point) < 0 &&
        Loop.isVisible(vertex, reflex)
      ) {
        // submerge vertex
        let i = candidates.length - 1;
        let dist = vec2.sqrDist(reflex.point, vertex.point);

        while (
          i >= 0 &&
          dist < vec2.sqrDist(reflex.point, candidates[i].point)
        ) {
          i--;
        }

        candidates.splice(i + 1, 0, vertex);
      }
    }

    let best: Vertex = null;

    if (candidates.length === 0) {
      vec2.negate(normal, reflex.normal);

      if (Loop.castRay(query, reflex, reflex.point, normal)) {
        best = Loop.split(query.edges[0], query.barycentric[0][0]);
      }
    } else {
      // find best vertex using some heuristics
      for (const vertex of candidates) {
        if (!best) {
          best = vertex;
        }

        if (Loop.isReflex(vertex)) {
          if (!Loop.isReflex(best)) {
            best = vertex;
          }

          // viewing cone
          Line.set(line0, vertex.edge0.normal, vertex.point);
          Line.set(line1, vertex.edge1.normal, vertex.point);

          if (
            Line.distance(line0, reflex.point) < 0 &&
            Line.distance(line1, reflex.point) < 0
          ) {
            best = vertex;
            break;
          }
        }
      }
    }

    if (!best) {
      throw new Error('polyDecompose: Some misleading occurred');
    }

    queue.remove(best);

    // split loop
    for (const edge of Loop.cut(reflex, best)) {
      if (Loop.isConvex(edge.v0)) {
        polygons.push(edge.v0);
      } else {
        if (Loop.isReflex(edge.v0)) {
          queue.enqueue(edge.v0);
        }

        if (Loop.isReflex(edge.v1)) {
          queue.enqueue(edge.v1);
        }
      }
    }
  }

  return polygons;
};

export const findSolids = (loops: Vertex[]): Map<Vertex, Vertex[]> => {
  const solids = new Map<Vertex, Vertex[]>(
    loops.filter(loop => Loop.isCCW(loop)).map(loop => [loop, []])
  );
  const query = new Loop.RayCastQuery();
  const queue = [...loops].sort(
    (a, b) => Math.abs(Loop.area(a)) - Math.abs(Loop.area(b))
  );

  for (let i = 0; i < queue.length; i++) {
    if (!Loop.isCCW(queue[i])) {
      for (let j = i + 1; j < queue.length; j++) {
        if (Loop.isCCW(queue[j])) {
          Loop.castRay(query, queue[j], queue[i].point, queue[i].normal);

          const contains = query.edges.length % 2 !== 0;

          if (contains) {
            solids.get(queue[j]).push(queue[i]);
            break;
          }
        }
      }
    }
  }

  return solids;
};

export const joinLoops = (
  inner: Vertex,
  outer: Vertex,
  siblings: Vertex[]
): Vertex => {
  const line0 = Line.create();
  const line1 = Line.create();
  const query = new Loop.RayCastQuery();
  const direction = vec2.create();

  let best: [Vertex, Vertex] = null;
  let min = Number.POSITIVE_INFINITY;

  if (Loop.isCCW(inner) || !Loop.isCCW(outer)) {
    throw new Error('join: wrong ordering');
  }

  for (const iv of Loop.of(inner)) {
    Line.set(line0, iv.edge0.normal, iv.point);
    Line.set(line1, iv.edge1.normal, iv.point);

    for (const ov of Loop.of(outer)) {
      if (
        Line.distance(line0, ov.point) < 0 &&
        Line.distance(line1, ov.point) < 0 &&
        Loop.isVisible(iv, ov)
      ) {
        vec2.subtract(direction, ov.point, iv.point);
        vec2.normalize(direction, direction);

        let blocked = false;

        // filter ones which are blocked by internal loops
        for (const loop of siblings) {
          if (Loop.castRay(query, loop, iv.point, direction)) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          let dist = vec2.sqrDist(iv.point, ov.point);

          if (dist < min) {
            min = dist;
            best = [iv, ov];
          }
        }
      }
    }
  }

  if (!best) {
    throw new Error('join: failed to find best point candidates');
  }

  const [edge] = Loop.cut(best[0], best[1]);

  return edge.v1;
};

export const decompose = (mesh: Readonly<Mesh>): Vertex[] => {
  const loops = findLoops(mesh);
  const solids = findSolids(loops);

  const contours: Vertex[] = [];

  for (let [outer, inner] of solids) {
    while (inner.length) {
      outer = joinLoops(inner.pop(), outer, inner);
    }

    contours.push(outer);
  }

  const polygons: Vertex[] = [];

  for (const contour of contours) {
    polygons.push(...decomposeLoop(contour));
  }

  return polygons;
};

import { vec2 } from 'gl-matrix';

import { Loop, Mesh, Vertex } from '../cd';
import { Line } from '../math';

import { PriorityQueue } from './priority-queue';

export const getLoops = (mesh: Mesh): Vertex[] => {
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

export const polyDecompose = (loop: Vertex): Vertex[] => {
  if (Loop.isConvex(loop)) {
    return [loop];
  }

  const line0 = Line.create();
  const line1 = Line.create();
  const normal = vec2.create();
  const bary = vec2.create();
  const polygons: Vertex[] = [];

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

      const edge = Loop.rayIntersection(bary, reflex, reflex.point, normal);

      if (edge) {
        best = Loop.split(edge, bary[0]);
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

export const joinLoops = (loops: Vertex[]): Vertex => {
  let outer = loops.find(loop => Loop.isCCW(loop));
  const inner = loops.filter(loop => loop !== outer);

  const line0 = Line.create();
  const line1 = Line.create();
  const bary = vec2.create();
  const direction = vec2.create();

  let best: [Vertex, Vertex] = null;
  let min = Number.POSITIVE_INFINITY;

  while (inner.length) {
    console.assert(!Loop.isCCW(inner[0]), 'wrong ordering');

    for (const iv of Loop.of(inner[0])) {
      Line.set(line0, iv.edge0.normal, iv.point);
      Line.set(line1, iv.edge1.normal, iv.point);

      for (const ov of Loop.of(outer)) {
        if (
          Line.distance(line0, ov.point) < 0 &&
          Line.distance(line1, ov.point) < 0
        ) {
          vec2.subtract(direction, ov.point, iv.point);
          vec2.normalize(direction, direction);

          let blocked = false;

          // filter ones which are blocked by internal loops
          for (const loop of inner) {
            if (Loop.rayIntersection(bary, loop, iv.point, direction)) {
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
      throw new Error('joinLoops');
    }

    const [edge] = Loop.cut(best[0], best[1]);
    outer = edge.v1;

    best = null;
    min = Number.POSITIVE_INFINITY;

    inner.shift();
  }

  return outer;
};

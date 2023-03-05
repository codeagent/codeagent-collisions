import { vec2, vec3 } from 'gl-matrix';

import { Edge, Loop, Mesh, Vertex } from '../cd';
import { closestPointToLineSegment, fromBarycentric } from '../math';

const line = vec3.create();
const normal = vec2.create();
const closest = vec2.create();
const x = vec2.create();
const bary = vec2.create();

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
        const vertexLoop = Loop.ofVertices(loop);
        Loop.ofEdges(vertexLoop);
        loops.push(vertexLoop);
        loop = null;
      }
    }
  }

  if (loop) {
    const vertexLoop = Loop.ofVertices(loop);
    Loop.ofEdges(vertexLoop);
    loops.push(vertexLoop);
  }

  return loops;
};

export const isVisible = (vertex: Vertex, from: Vertex): boolean => {
  vec2.sub(normal, vertex.point, from.point);
  const dist = vec2.length(normal);
  vec2.scale(normal, normal, 1.0 / dist);
  vec2.set(normal, normal[1], -normal[0]);

  Line.set(line, normal, from.point);

  let d0 = 0;
  let d1 = 0;

  for (const curr of Loop.iterator(from.next)) {
    d1 = Line.distance(line, curr.point);

    // sign is changed means we are intersecting a looking ray
    if (d0 * d1 < 0) {
      const t = Math.abs(d0) / (Math.abs(d0) + Math.abs(d1));
      vec2.lerp(x, curr.prev.point, curr.point, t);

      if (vec2.dist(x, from.point) < dist) {
        return false;
      }
    }

    d0 = d1;
  }

  return true;
};

export const polyDecompose = (loop: Vertex): Vertex[] => {
  const polygons: Vertex[] = [];

  const queue = Array.from(Loop.iterator(loop)).filter(vertex =>
    Loop.isReflex(vertex)
  );

  const line0 = Line.create();
  const line1 = Line.create();

  let depth = 0;

  while (queue.length) {
    depth++;
    const reflex = queue.shift();

    // viewing cone
    Line.set(line0, reflex.edge0.normal, reflex.point);
    Line.set(line1, reflex.edge1.normal, reflex.point);

    // list of visible vervices ordered by distance from current reflex vertex
    const candidates: Vertex[] = [];

    for (const vertex of Loop.iterator(reflex)) {
      // if in viewing cone and is visble
      if (
        vertex !== reflex &&
        Line.distance(line0, vertex.point) < 0 &&
        Line.distance(line1, vertex.point) < 0 &&
        isVisible(vertex, reflex)
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
      // find best edge and split it
      let min = Number.POSITIVE_INFINITY;
      let closestEdge: Edge = null;
      let t = 0;

      for (const edge of Loop.iterator(reflex.edge1)) {
        if (
          Line.distance(line0, edge.v0.point) > 0 &&
          Line.distance(line1, edge.v1.point) > 0
        ) {
          //
          closestPointToLineSegment(
            bary,
            edge.v0.point,
            edge.v1.point,
            reflex.point
          );
          fromBarycentric(closest, bary, edge.v0.point, edge.v1.point);

          let dist = vec2.sqrDist(closest, reflex.point);

          if (dist < min) {
            min = dist;
            closestEdge = edge;
            t = bary[0];
          }
        }

        if (closestEdge) {
          best = closestEdge.split(t);
        }
      }
    } else {
      // find beset vertex using some heuristics
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

    // console.log(depth)

    if (!best) {
      throw new Error('polyDecompose: Some misleading occurred');
    }

    // split loop
    for (const edge of Loop.cut(reflex, best)) {
      if (Loop.isConvex(edge.v0)) {
        polygons.push(edge.v0);
      } else {
        if (Loop.isReflex(edge.v0)) {
          queue.push(edge.v0);
        }

        if (Loop.isReflex(edge.v1)) {
          queue.push(edge.v1);
        }
      }
    }
  }

  return polygons;
};

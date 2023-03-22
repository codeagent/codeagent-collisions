import { vec2 } from 'gl-matrix';

import { cross, Line } from '../math';

export class Vertex {
  normal = vec2.create();

  prev: Vertex = null;

  next: Vertex = null;

  edge0: Edge = null; // incoming

  edge1: Edge = null; // outgoing

  constructor(public point: vec2) {}
}

export class Edge {
  normal = vec2.create();

  prev: Edge = null;

  next: Edge = null;

  constructor(public v0: Vertex, public v1: Vertex) {
    vec2.sub(this.normal, this.v1.point, this.v0.point);
    vec2.normalize(this.normal, this.normal);
    vec2.set(this.normal, this.normal[1], -this.normal[0]);
  }
}

export namespace Loop {
  const e0 = vec2.create();
  const e1 = vec2.create();
  const x = vec2.create();
  const line = Line.create();
  const normal = vec2.create();

  export class RayCastQuery {
    readonly edges: Edge[] = [];

    readonly barycentric: vec2[] = [];
  }

  export function* of<T extends { next: T; prev: T }>(loop: T): Iterable<T> {
    let curr: T = loop;

    do {
      yield curr;

      curr = curr.next;
    } while (curr !== loop);
  }

  export const from = (points: Readonly<vec2[]>): Vertex => {
    let firstFertex: Vertex = null;
    let lastFertex: Vertex = null;

    for (const point of points) {
      const vertex = new Vertex(point);

      if (lastFertex) {
        lastFertex.next = vertex;
        vertex.prev = lastFertex;
      } else {
        firstFertex = vertex;
      }

      lastFertex = vertex;
    }

    lastFertex.next = firstFertex;
    firstFertex.prev = lastFertex;

    let firstEdge: Edge = null;
    let lastEdge: Edge = null;

    for (const vertex of Loop.of(firstFertex)) {
      const edge = new Edge(vertex, vertex.next);

      if (lastEdge) {
        lastEdge.next = edge;
        edge.prev = lastEdge;
      } else {
        firstEdge = edge;
      }

      vertex.edge0 = lastEdge;
      vertex.edge1 = edge;

      lastEdge = edge;
    }

    lastEdge.next = firstEdge;
    firstEdge.prev = lastEdge;
    firstFertex.edge0 = lastEdge;

    for (const edge of Loop.of(firstEdge)) {
      vec2.add(edge.v0.normal, edge.normal, edge.prev.normal);
      vec2.scale(
        edge.v0.normal,
        edge.v0.normal,
        1.0 / (1.0 + vec2.dot(edge.normal, edge.prev.normal))
      );
    }

    return firstFertex;
  };

  export const points = (loop: Readonly<Vertex>): vec2[] => {
    return Array.from(Loop.of(loop)).map(vertex => vertex.point);
  };

  export const centroid = (loop: Readonly<Vertex>): vec2 => {
    const centroid = vec2.create();
    let counter = 0;

    for (const vertex of Loop.of(loop)) {
      vec2.add(centroid, centroid, vertex.point);
      counter++;
    }

    return vec2.scale(centroid, centroid, 1.0 / counter);
  };

  export const isReflex = (vertex: Vertex): boolean => {
    vec2.sub(e0, vertex.point, vertex.prev.point);
    vec2.sub(e1, vertex.next.point, vertex.point);
    return cross(e0, e1) < 0;
  };

  export const angle = (vertex: Vertex): number => {
    vec2.sub(e0, vertex.point, vertex.prev.point);
    vec2.sub(e1, vertex.next.point, vertex.point);

    if (cross(e0, e1) < 0) {
      return -vec2.angle(e0, e1);
    } else {
      return vec2.angle(e0, e1);
    }
  };

  export const area = (loop: Vertex): number => {
    let sum = 0;

    for (const vertex of Loop.of(loop)) {
      const p0 = vertex.point;
      const p1 = vertex.next.point;

      sum += cross(p0, p1);
    }

    return sum;
  };

  export const isCCW = (loop: Vertex): boolean => {
    return area(loop) > 0;
  };

  export const isConvex = (loop: Vertex): boolean => {
    for (const vertex of Loop.of(loop)) {
      if (isReflex(vertex)) {
        return false;
      }
    }

    return true;
  };

  export const isVisible = (vertex: Vertex, from: Vertex): boolean => {
    vec2.sub(normal, vertex.point, from.point);
    const dist = vec2.length(normal);
    vec2.scale(normal, normal, 1.0 / dist);
    vec2.set(normal, normal[1], -normal[0]);

    Line.set(line, normal, from.point);

    let d0 = 0;
    let d1 = 0;

    for (const curr of Loop.of(from)) {
      if (curr === vertex || curr === from) {
        d1 = 0;
      } else {
        d1 = Line.distance(line, curr.point);
      }

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

  export const castRay = (
    out: RayCastQuery,
    loop: Readonly<Vertex>,
    origin: Readonly<vec2>,
    direction: Readonly<vec2>
  ): boolean => {
    out.barycentric.length = 0;
    out.edges.length = 0;

    vec2.set(normal, direction[1], -direction[0]);
    Line.set(line, normal, origin);

    let d0 = 0;
    let d1 = 0;

    for (const vertex of Loop.of(loop)) {
      if (vertex === loop) {
        d1 = 0;
      } else {
        d1 = Line.distance(line, vertex.point);
      }

      // intersection occured
      if (
        vertex !== loop.prev &&
        vertex !== loop &&
        vertex !== loop.next &&
        d0 * d1 < 0
      ) {
        // find intersection point x
        const t = Math.abs(d0) / (Math.abs(d0) + Math.abs(d1));
        vec2.lerp(x, vertex.prev.point, vertex.point, t);
        vec2.subtract(x, x, origin);

        if (vec2.dot(x, direction) > 0) {
          // submerge vertex
          const dist = vec2.sqrLen(x);
          let i = out.edges.length - 1;

          while (
            i >= 0 &&
            dist <
              vec2.sqrDist(
                origin,
                vec2.lerp(
                  x,
                  out.edges[i].v0.point,
                  out.edges[i].v1.point,
                  out.barycentric[i][0]
                )
              )
          ) {
            i--;
          }

          out.edges.splice(i + 1, 0, vertex.edge0);
          out.barycentric.splice(i + 1, 0, vec2.fromValues(t, 1.0 - t));
        }
      }

      d0 = d1;
    }

    return out.edges.length !== 0;
  };

  export const cut = (v0: Vertex, v1: Vertex): [Edge, Edge] => {
    const edges: [Edge, Edge] = [null, null];

    let i = 0;

    for (const [from, to] of [
      [v0, v1],
      [v1, v0],
    ]) {
      const start = new Vertex(from.point);
      const end = new Vertex(to.point);
      const edge = new Edge(start, end);

      // vertices
      start.prev = from.prev;
      from.prev.next = start;

      start.next = end;
      end.prev = start;

      end.next = to.next;
      to.next.prev = end;

      // edges
      edge.next = to.edge1;
      to.edge1.prev = edge;

      edge.prev = from.edge0;
      from.edge0.next = edge;

      //  vertex-edge
      start.edge0 = from.edge0;
      from.edge0.v1 = start;

      end.edge1 = to.edge1;
      to.edge1.v0 = end;

      start.edge1 = end.edge0 = edge;

      // normals
      for (const vertex of [start, end]) {
        vec2.add(vertex.normal, vertex.edge0.normal, vertex.edge1.normal);
        vec2.scale(
          vertex.normal,
          vertex.normal,
          1.0 / (1.0 + vec2.dot(vertex.edge0.normal, vertex.edge1.normal))
        );
      }

      edges[i++] = edge;
    }

    v0.prev = v0.next = v0.edge0 = v0.edge1 = null;
    v1.prev = v1.next = v1.edge0 = v1.edge1 = null;

    return edges;
  };

  export const split = (edge: Edge, t: number): Vertex => {
    const vertex = new Vertex(vec2.create());
    vec2.lerp(vertex.point, edge.v0.point, edge.v1.point, t);
    vec2.copy(vertex.normal, edge.normal);

    const left = new Edge(edge.v0, vertex);
    const right = new Edge(vertex, edge.v1);

    // edges
    left.prev = edge.prev;
    edge.prev.next = left;

    left.next = right;
    right.prev = left;

    right.next = edge.next;
    edge.next.prev = right;

    // vertices
    vertex.prev = edge.v0;
    edge.v0.next = vertex;

    vertex.next = edge.v1;
    edge.v1.prev = vertex;

    // edge-vertices
    edge.v0.edge1 = left;
    vertex.edge0 = left;

    edge.v1.edge0 = right;
    vertex.edge1 = right;

    edge.v0 = edge.v1 = edge.next = edge.prev = null;

    return vertex;
  };

  export const check = (loop: Vertex, maxLength = 16384): void => {
    let length = 0;
    let lastVertex: Vertex = null;

    for (const vertex of Loop.of(loop)) {
      console.assert(length++ < maxLength, 'Vertex length check failed');
      console.assert(
        vertex.prev && vertex.next,
        'Vertex siblings check failed'
      );
      console.assert(
        vertex.edge0.v1 === vertex && vertex.edge1.v0 === vertex,
        'Vertex edges check failed'
      );

      lastVertex = vertex;
    }

    console.assert(
      lastVertex.next === loop && loop.prev === lastVertex,
      'Vertex loop closeness'
    );

    length = 0;
    let lastEdge: Edge = null;
    for (const edge of Loop.of(loop.edge1)) {
      console.assert(length++ < maxLength, 'Edge length check failed');
      console.assert(edge.prev && edge.next, 'Edge siblings check failed');
      console.assert(
        edge.v0 === edge.prev.v1 && edge.v1 === edge.next.v0,
        'Edge vertices check failed'
      );
      console.assert(
        !vec2.exactEquals(edge.v0.point, edge.v1.point),
        'Edge vertices inequality check failed'
      );

      lastEdge = edge;
    }

    console.assert(
      lastEdge.next === loop.edge1 && loop.edge1.prev === lastEdge,
      'Edge loop closeness'
    );

    console.assert(isCCW(loop), 'CCW check failed');
    console.assert(length > 2, 'Min length check failed');
  };

  export const dumpRings = (rings: Map<Vertex, Vertex[]>): void => {
    const collection = [];

    for (const [loop, children] of rings) {
      let path = [];

      for (const child of [loop, ...children]) {
        path.push(
          `${Loop.isCCW(child) ? 'CCW' : 'CW'}[${Math.abs(
            Loop.area(child)
          ).toFixed(2)}]`
        );
      }

      collection.push(path);
    }

    console.log(collection);
  };
}

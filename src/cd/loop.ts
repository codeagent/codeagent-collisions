import { vec2 } from 'gl-matrix';

import { cross } from '../math';

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

  split(t: number): Vertex {
    const vertex = new Vertex(vec2.create());
    vec2.lerp(vertex.point, this.v0.point, this.v1.point, t);
    vec2.copy(vertex.normal, this.normal);

    const left = new Edge(this.v0, vertex);
    const right = new Edge(vertex, this.v1);

    left.prev = this.prev;
    this.prev.next = left;

    left.next = right;
    right.prev = left;

    right.next = this.next;
    this.next.prev = right;

    this.v0.next = vertex;
    vertex.prev = this.v0;
    this.v0.edge1 = left;

    this.v1.prev = vertex;
    vertex.next = this.v1;
    this.v1.edge0 = right;

    vertex.edge0 = left;
    vertex.edge1 = right;

    this.v0 = this.v1 = this.next = this.prev = null;

    return vertex;
  }
}

export namespace Loop {
  const e0 = vec2.create();
  const e1 = vec2.create();

  export const ofVertices = (points: Readonly<vec2[]>): Vertex => {
    let first: Vertex = null;
    let last: Vertex = null;

    for (const point of points) {
      const vertex = new Vertex(point);

      if (last) {
        last.next = vertex;
        vertex.prev = last;
      } else {
        first = vertex;
      }

      last = vertex;
    }

    last.next = first;
    first.prev = last;

    return first;
  };

  export const ofEdges = (loop: Vertex): Edge => {
    let first: Edge = null;
    let last: Edge = null;
    let vertex = loop;

    do {
      const edge = new Edge(vertex, vertex.next);

      if (last) {
        last.next = edge;
        edge.prev = last;
      } else {
        first = edge;
      }

      vertex.edge0 = last;
      vertex.edge1 = edge;

      last = edge;
      vertex = vertex.next;
    } while (vertex !== loop);

    last.next = first;
    first.prev = last;
    vertex.edge0 = last;

    let edge = first;
    do {
      vec2.add(edge.v0.normal, edge.normal, edge.prev.normal);
      vec2.scale(
        edge.v0.normal,
        edge.v0.normal,
        1.0 / (1.0 + vec2.dot(edge.normal, edge.prev.normal))
      );

      edge = edge.next;
    } while (edge !== first);

    return first;
  };

  export const isReflex = (vertex: Vertex): boolean => {
    vec2.sub(e0, vertex.point, vertex.prev.point);
    vec2.sub(e1, vertex.next.point, vertex.point);
    return cross(e0, e1) < 0;
  };

  export const isCCW = (loop: Vertex): boolean => {
    let sum = 0;

    for (const vertex of Loop.iterator(loop)) {
      const p0 = vertex.point;
      const p1 = vertex.next.point;

      sum += cross(p0, p1);
    }

    return sum > 0;
  };

  export const isConvex = (loop: Vertex): boolean => {
    for (const vertex of Loop.iterator(loop)) {
      if (isReflex(vertex)) {
        return false;
      }
    }

    return true;
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
      vec2.add(start.normal, start.edge0.normal, start.edge1.normal);
      vec2.scale(
        start.normal,
        start.normal,
        1.0 / (1.0 + vec2.dot(start.edge0.normal, start.edge1.normal))
      );

      vec2.add(end.normal, end.edge0.normal, end.edge1.normal);
      vec2.scale(
        end.normal,
        end.normal,
        1.0 / (1.0 + vec2.dot(end.edge0.normal, end.edge1.normal))
      );

      edges[i++] = edge;
    }

    return edges;
  };

  export function* iterator<T extends { next: T }>(loop: T): Iterable<T> {
    let curr: T = loop;

    do {
      yield curr;

      curr = curr.next;
    } while (curr !== loop);
  }
}

import { mat3, vec2, vec3 } from 'gl-matrix';
import { getPolygonCentroid, getPolygonSignedArea } from '../../math';
import { AABB } from '../aabb';
import { Shape, MassDistribution } from './shape.interface';

const v = vec2.create();
export class Vertex {
  public readonly normal: Readonly<vec2>;
  public readonly prev: Vertex = null;
  public readonly next: Vertex = null;
  public readonly edge0: Edge = null; // incoming
  public readonly edge1: Edge = null; // outcoming

  constructor(public readonly point: Readonly<vec2>) {}
}

export class Edge {
  public readonly normal = vec2.create();
  public readonly prev: Edge = null;
  public readonly next: Edge = null;

  constructor(
    public readonly v0: Readonly<Vertex>,
    public readonly v1: Readonly<Vertex>
  ) {
    vec2.sub(this.normal, this.v1.point, this.v0.point);
    vec2.normalize(this.normal, this.normal);
    vec2.set(this.normal, this.normal[1], -this.normal[0]);
  }
}

export class Polygon implements Shape, MassDistribution {
  readonly radius: number = 0;
  readonly loop: Vertex = null;
  readonly edgeLoop: Edge = null;

  cachedSupportVertex: Readonly<Vertex> = null;

  /**
   * @param points array of couter-clock wise oriented loop of points
   * @param transformOrigin
   */
  constructor(
    public readonly points: Readonly<vec2[]>,
    public readonly transformOrigin: boolean = true
  ) {
    if (transformOrigin) {
      points = this.transformOriginToCentroid(points);
    }

    this.loop = this.cachedSupportVertex = this.createVertexLoop(points);
    this.edgeLoop = this.createEdgeLoop(this.loop);
    this.radius = this.getRadius();
  }

  support(out: vec2, dir: Readonly<vec2>, margin: number = 0): vec2 {
    let curr: Vertex = this.cachedSupportVertex;
    let best = vec2.dot(curr.point, dir);

    if (vec2.dot(curr.next.point, dir) > best) {
      curr = curr.next;

      while (vec2.dot(curr.next.point, dir) > vec2.dot(curr.point, dir)) {
        curr = curr.next;
      }
    } else if (vec2.dot(curr.prev.point, dir) > best) {
      curr = curr.prev;

      while (vec2.dot(curr.prev.point, dir) > vec2.dot(curr.point, dir)) {
        curr = curr.prev;
      }
    }

    this.cachedSupportVertex = curr;

    vec2.copy(out, curr.point);
    return vec2.scaleAndAdd(out, out, curr.normal, margin);
  }

  aabb(out: AABB, transform: mat3): AABB {
    // @todo: optimisation

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const vertex of this.vertices()) {
      vec2.transformMat3(v, vertex.point, transform);

      if (v[0] < minX) {
        minX = v[0];
      }
      if (v[1] < minY) {
        minY = v[1];
      }
      if (v[0] > maxX) {
        maxX = v[0];
      }
      if (v[1] > maxY) {
        maxY = v[1];
      }
    }

    vec2.set(out[0], minX, minY);
    vec2.set(out[1], maxX, maxY);

    return out;
  }

  testPoint(point: vec2): boolean {
    const e = vec2.create();
    const r = vec2.create();
    const x = vec3.create();

    for (const vertex of this.vertices()) {
      const p0 = vertex.point;
      const p1 = vertex.next.point;
      vec2.sub(e, p1, p0);
      vec2.sub(r, point, p0);
      vec2.cross(x, e, r);
      if (x[2] < 0) {
        return false;
      }
    }

    return true;
  }

  inetria(mass: number): number {
    let area: number = 0.0;
    let jx = 0.0;
    let jy = 0.0;
    for (const vertex of this.vertices()) {
      const p0 = vertex.point;
      const p1 = vertex.next.point;
      const cross = p0[0] * p1[1] - p1[0] * p0[1];
      jx += cross * (p0[1] * p0[1] + p0[1] * p1[1] + p1[1] * p1[1]);
      jy += cross * (p0[0] * p0[0] + p0[0] * p1[0] + p1[0] * p1[0]);
      area += cross;
    }
    return (mass / 6.0 / area) * (jx + jy);
  }

  *vertices(): Iterable<Vertex> {
    let vertex = this.loop;

    do {
      yield vertex;
      vertex = vertex.next;
    } while (vertex !== this.loop);
  }

  *edges(): Iterable<Edge> {
    let edge = this.edgeLoop;

    do {
      yield edge;
      edge = edge.next;
    } while (edge !== this.edgeLoop);
  }

  private transformOriginToCentroid(polygon: Readonly<vec2[]>): vec2[] {
    const area = getPolygonSignedArea(polygon);
    const shift = getPolygonCentroid(polygon, area);
    return polygon.map((point) => vec2.subtract(vec2.create(), point, shift));
  }

  private getRadius(): number {
    return Array.from(this.vertices())
      .map((p) => vec2.length(p.point))
      .reduce((max, length) => (length > max ? length : max), 0);
  }

  private createVertexLoop(points: Readonly<vec2[]>): Vertex {
    let first: Vertex = null;
    let last: Vertex = null;

    for (const point of points) {
      const vertex = new Vertex(point);

      if (last) {
        (last.next as Vertex) = vertex;
        (vertex.prev as Vertex) = last;
      } else {
        first = vertex;
      }

      last = vertex;
    }

    (last.next as Vertex) = first;
    (first.prev as Vertex) = last;

    return first;
  }

  private createEdgeLoop(loop: Vertex): Edge {
    let first: Edge = null;
    let last: Edge = null;
    let vertex = loop;

    do {
      const edge = new Edge(vertex, vertex.next);

      if (last) {
        (last.next as Edge) = edge;
        (edge.prev as Edge) = last;
      } else {
        first = edge;
      }

      (vertex.edge0 as Edge) = last;
      (vertex.edge1 as Edge) = edge;

      last = edge;
      vertex = vertex.next;
    } while (vertex !== loop);

    (last.next as Edge) = first;
    (first.prev as Edge) = last;
    (vertex.edge0 as Edge) = last;

    let edge = first;
    do {
      const normal = vec2.create();
      vec2.add(normal, edge.normal, edge.prev.normal);
      vec2.scale(
        normal,
        normal,
        1.0 / (1.0 + vec2.dot(edge.normal, edge.prev.normal))
      );
      (edge.v0.normal as vec2) = normal;

      edge = edge.next;
    } while (edge !== first);

    return first;
  }
}

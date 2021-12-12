import { mat3, vec2, vec3 } from 'gl-matrix';
import { OBB } from './mesh';

export type AABB = [vec2, vec2];

export interface Shape {
  /**
   * @param out result will be placed here
   * @param dir normalized direction to search support point along
   * @returns support point on local frame of reference
   */
  support(out: vec2, dir: vec2): vec2;
}

export interface TestTarget {
  /**
   * @param point 2d local point to test against
   * @return result of examine
   */
  testPoint(point: vec2): boolean;
}

export interface AABBBounded {
  /**
   * @param out result will be place here
   * @param transform transformation to be used for calculating net result
   * @returns net result
   */
  aabb(out: AABB, transform: mat3): AABB;
}

export class Circle implements Shape, AABBBounded, TestTarget {
  constructor(public readonly radius: number) {}

  public support(out: vec2, dir: vec2): vec2 {
    vec2.normalize(out, dir);
    return vec2.scale(out, out, this.radius);
  }

  public aabb(out: AABB, transform: mat3): AABB {
    const center = vec2.fromValues(transform[6], transform[7]);
    vec2.set(out[0], center[0] - this.radius, center[1] - this.radius);
    vec2.set(out[1], center[0] + this.radius, center[1] + this.radius);
    return out;
  }

  public testPoint(point: vec2): boolean {
    return vec2.dot(point, point) < this.radius * this.radius;
  }
}

export class Polygon implements Shape, AABBBounded, TestTarget {
  public readonly normals: vec2[];

  /**
   * @param hull array of couter-clock wise oriented loop of points
   */
  constructor(public readonly points: vec2[]) {
    this.normals = this.getNormals(points);
  }

  public support(out: vec2, dir: vec2): vec2 {
    const index = this.indexOfFarhestPoint(dir);
    return vec2.copy(out, this.points[index]);
  }

  public aabb(out: AABB, transform: mat3): AABB {
    const v = vec2.create();

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const p of this.points) {
      vec2.transformMat3(v, p, transform);

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

  public testPoint(point: vec2): boolean {
    const e = vec2.create();
    const r = vec2.create();
    const x = vec3.create();

    for (let i = 0; i < this.points.length; i++) {
      const p0 = this.points[i];
      const p1 = this.points[(i + 1) % this.points.length];
      vec2.sub(e, p1, p0);
      vec2.sub(r, point, p0);
      vec2.cross(x, e, r);
      if (x[2] < 0) {
        return false;
      }
    }

    return true;
  }

  public indexOfFarhestPoint(dir: vec2): number {
    // @todo: hill climbing
    let bestDot = Number.NEGATIVE_INFINITY;
    let index = -1;
    for (let i = 0; i < this.points.length; i++) {
      const dot = vec2.dot(this.points[i], dir);
      if (dot > bestDot) {
        bestDot = dot;
        index = i;
      }
    }
    return index;
  }

  private getNormals(loop: vec2[]): vec2[] {
    const normals: vec2[] = [];
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      const n = vec2.create();
      vec2.sub(n, b, a);
      vec2.set(n, n[1], -n[0]);
      vec2.normalize(n, n);
      normals.push(n);
    }
    return normals;
  }
}

export class Box extends Polygon {
  constructor(public readonly width: number, public readonly height: number) {
    super([
      vec2.fromValues(-width * 0.5, height * 0.5),
      vec2.fromValues(-width * 0.5, -height * 0.5),
      vec2.fromValues(width * 0.5, -height * 0.5),
      vec2.fromValues(width * 0.5, height * 0.5),
    ]);
  }
}

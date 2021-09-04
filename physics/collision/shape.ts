import { vec2 } from 'gl-matrix';

export interface Shape {
  /**
   * @param out result will be placed here
   * @param dir normalized direction to search support point along
   * @returns support point on local frame of reference
   */
  support(out: vec2, dir: vec2): vec2;
}

export class Circle implements Shape {
  constructor(public readonly radius: number) {}

  public support(out: vec2, dir: vec2): vec2 {
    vec2.normalize(out, dir);
    return vec2.scale(out, out, this.radius);
  }
}

export class Polygon implements Shape {
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
      vec2.fromValues(width * 0.5, height * 0.5)
    ]);
  }
}

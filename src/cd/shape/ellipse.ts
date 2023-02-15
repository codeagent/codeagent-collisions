import { mat3, vec2 } from 'gl-matrix';

import { AABB } from '../aabb';
import { Convex } from '../types';

import { Polygon } from './polygon';

const createEllipseConvex = (r0: number, r1: number): Convex => {
  return {
    support(out: vec2, dir: vec2): vec2 {
      const a2 = r0 * r0;
      const b2 = r1 * r1;
      const denom = Math.sqrt(dir[0] * dir[0] * a2 + dir[1] * dir[1] * b2);
      return vec2.set(out, (dir[0] * a2) / denom, (dir[1] * b2) / denom);
    },
  };
};

const createEllipsePoints = (
  r0: number,
  r1: number,
  subdivisions: number
): vec2[] => {
  const points: vec2[] = [];

  let angle = 0.0;
  const delta = (2 * Math.PI) / subdivisions;

  for (let i = 0; i < subdivisions; i++, angle += delta) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    points.push(vec2.fromValues(r0 * cosA, r1 * sinA));
  }

  return points;
};

export class Ellipse extends Polygon {
  private readonly convex: Convex;

  /**
   * @param a radius along x axis
   * @param b radius along y axis
   */
  constructor(
    public readonly a: number,
    public readonly b: number,
    public readonly subdivisions = 32
  ) {
    super(createEllipsePoints(a, b, subdivisions));
    this.convex = createEllipseConvex(a, b);
  }

  testPoint(point: vec2): boolean {
    return (
      (point[0] * point[0]) / this.a / this.a +
        (point[1] * point[1]) / this.b / this.b <
      1.0
    );
  }

  aabb(out: AABB, transform: mat3): AABB {
    return AABB.fromConvex(out, this.convex, transform);
  }
}

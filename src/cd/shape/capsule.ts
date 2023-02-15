import { mat3, vec2 } from 'gl-matrix';

import { closestPointToLineSegment, fromBarycentric } from '../../math';
import { AABB } from '../aabb';
import { Convex } from '../types';

import { Polygon } from './polygon';

const createCapsuleConvex = (radius: number, height: number): Convex => {
  return {
    support(out: vec2, dir: vec2): vec2 {
      vec2.normalize(out, dir);
      return vec2.set(
        out,
        out[0] * radius,
        out[1] * radius + Math.sign(out[1]) * height
      );
    },
  };
};

const createCapsulePoints = (
  radius: number,
  height: number,
  subdivisions: number
): vec2[] => {
  const top: vec2[] = [];
  const bottom: vec2[] = [];

  let angle = 0.0;
  const delta = Math.PI / subdivisions;
  for (let i = 0; i <= subdivisions; i++, angle += delta) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    top.push(vec2.fromValues(radius * cosA, radius * sinA + height * 0.5));
    bottom.push(vec2.fromValues(-radius * cosA, -radius * sinA - height * 0.5));
  }

  return top.concat(bottom);
};

// vertically aligned capsule
export class Capsule extends Polygon {
  private readonly convex: Convex;

  constructor(
    public readonly r: number,
    public readonly height: number,
    public readonly subdivisions = 16
  ) {
    super(createCapsulePoints(r, height, subdivisions));
    this.convex = createCapsuleConvex(r, height * 0.5);
  }

  testPoint(point: vec2): boolean {
    const bary = vec2.create();
    const closest = vec2.create();
    const p0 = vec2.fromValues(0, -this.height * 0.5);
    const p1 = vec2.fromValues(0, this.height * 0.5);
    closestPointToLineSegment(bary, p0, p1, point);
    fromBarycentric(closest, bary, p0, p1);

    return vec2.distance(closest, point) < this.r;
  }

  aabb(out: AABB, transform: mat3): AABB {
    return AABB.fromConvex(out, this.convex, transform);
  }
}

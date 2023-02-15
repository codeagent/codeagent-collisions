import { mat3, vec2 } from 'gl-matrix';

import { sqDistanceToLineSegment } from '../math';

import { Convex } from './types';

export class AABB {
  constructor(
    public readonly min = vec2.create(),
    public readonly max = vec2.create()
  ) {}
}

export module AABB {
  const dir = vec2.create();
  const enter = vec2.create();
  const exit = vec2.create();
  const p = vec2.create();
  const swollen = new AABB();

  export const EPSILON = 1.0e-3;

  export const testAABB = (aabb0: Readonly<AABB>, aabb1: Readonly<AABB>) => {
    return (
      aabb1.min[0] < aabb0.max[0] &&
      aabb1.max[0] > aabb0.min[0] &&
      aabb1.min[1] < aabb0.max[1] &&
      aabb1.max[1] > aabb0.min[1]
    );
  };

  export const testLineSegment = (
    enter: vec2,
    exit: vec2,
    aabb: Readonly<AABB>,
    p0: Readonly<vec2>,
    p1: Readonly<vec2>
  ) => {
    let entry = 0;
    let leave = 1;

    vec2.sub(dir, p1, p0);

    for (let i = 0; i < 2; i++) {
      if (Math.abs(dir[i]) < EPSILON) {
        if (p0[i] < aabb.min[i] || p1[i] > aabb.max[i]) {
          return false;
        }
      } else {
        const ood = 1.0 / dir[i];
        let t1 = (aabb.min[i] - p0[i]) * ood;
        let t2 = (aabb.max[i] - p0[i]) * ood;

        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
        }

        // farhtest entry
        if (t1 > entry) {
          entry = t1;
        }

        // nearest exit
        if (t2 < leave) {
          leave = t2;
        }

        if (leave < entry) {
          return false;
        }
      }
    }

    vec2.scaleAndAdd(enter, p0, dir, entry);
    vec2.scaleAndAdd(exit, p0, dir, leave);

    return true;
  };

  export const testCapsule = (
    aabb: Readonly<AABB>,
    p0: Readonly<vec2>,
    p1: Readonly<vec2>,
    radius: number
  ) => {
    vec2.set(swollen.min, aabb.min[0] - radius, aabb.min[1] - radius);
    vec2.set(swollen.max, aabb.max[0] + radius, aabb.max[1] + radius);

    if (!testLineSegment(enter, exit, swollen, p0, p1)) {
      return false;
    }

    const r2 = radius * radius;

    if (enter[0] < aabb.min[0]) {
      if (enter[1] < aabb.min[1]) {
        // left-bottom
        return sqDistanceToLineSegment(enter, exit, aabb.min) < r2;
      } else if (enter[1] > aabb.max[1]) {
        // left-top
        return (
          sqDistanceToLineSegment(
            enter,
            exit,
            vec2.fromValues(aabb.min[0], aabb.max[1])
          ) < r2
        );
      }
    } else if (enter[0] > aabb.max[0]) {
      if (enter[1] > aabb.max[1]) {
        // right-top
        return sqDistanceToLineSegment(enter, exit, aabb.max) < r2;
      } else if (enter[1] < aabb.min[1]) {
        // right-bottom
        return (
          sqDistanceToLineSegment(
            enter,
            exit,
            vec2.fromValues(aabb.max[0], aabb.min[1])
          ) < r2
        );
      }
    }

    return true;
  };

  export const fromConvex = (
    out: AABB,
    convex: Convex,
    transform: Readonly<mat3>
  ): AABB => {
    // top
    vec2.set(p, transform[1], transform[4]);
    convex.support(p, p);

    vec2.transformMat3(p, p, transform);
    out.max[1] = p[1];

    // right
    vec2.set(p, transform[0], transform[3]);
    convex.support(p, p);

    vec2.transformMat3(p, p, transform);
    out.max[0] = p[0];

    // bottom
    vec2.set(p, -transform[1], -transform[4]);
    convex.support(p, p);

    vec2.transformMat3(p, p, transform);
    out.min[1] = p[1];

    // right
    vec2.set(p, -transform[0], -transform[3]);
    convex.support(p, p);

    vec2.transformMat3(p, p, transform);
    out.min[0] = p[0];

    return out;
  };
}

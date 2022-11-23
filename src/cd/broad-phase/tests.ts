import { vec2 } from 'gl-matrix';
import {
  closestPointsBetweenLineSegments,
  sqDistanceToLineSegment,
} from '../../math';
import { AABB } from '../';

/**
 * Test for two aabb-s
 */
export const testAABBAABB = (aabb1: Readonly<AABB>, aabb2: Readonly<AABB>) => {
  return (
    aabb2[0][0] < aabb1[1][0] &&
    aabb2[1][0] > aabb1[0][0] &&
    aabb2[0][1] < aabb1[1][1] &&
    aabb2[1][1] > aabb1[0][1]
  );
};

export const AABBLineSegmentIntersection = (
  enter: vec2,
  exit: vec2,
  aabb: Readonly<AABB>,
  p0: Readonly<vec2>,
  p1: Readonly<vec2>,
  epsilon = 1.0e-3
) => {
  let entry = 0;
  let leave = 1;
  let dir = vec2.sub(vec2.create(), p1, p0);

  for (let i = 0; i < 2; i++) {
    if (Math.abs(dir[i]) < epsilon) {
      if (p0[i] < aabb[0][i] || p1[i] > aabb[1][i]) {
        return false;
      }
    } else {
      let ood = 1.0 / dir[i];
      let t1 = (aabb[0][i] - p0[i]) * ood;
      let t2 = (aabb[1][i] - p0[i]) * ood;

      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }

      if (t1 > entry) {
        // farhtest entry
        entry = t1;
      }

      if (t2 < leave) {
        // nearest exit
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

export const testAABBCapsule = (
  aabb: Readonly<AABB>,
  p0: Readonly<vec2>,
  p1: Readonly<vec2>,
  radius: number,
  epsilon = 1.0e-3
) => {
  const enter = vec2.create();
  const exit = vec2.create();
  const swollen: AABB = [
    vec2.fromValues(aabb[0][0] - radius, aabb[0][1] - radius),
    vec2.fromValues(aabb[1][0] + radius, aabb[1][1] + radius),
  ];

  if (!AABBLineSegmentIntersection(enter, exit, swollen, p0, p1, epsilon)) {
    return false;
  }

  const r2 = radius * radius;

  if (enter[0] < aabb[0][0]) {
    if (enter[1] < aabb[0][1]) {
      // left-bottom
      return sqDistanceToLineSegment(enter, exit, aabb[0]) < r2;
    } else if (enter[1] > aabb[1][1]) {
      // left-top
      return (
        sqDistanceToLineSegment(
          enter,
          exit,
          vec2.fromValues(aabb[0][0], aabb[1][1])
        ) < r2
      );
    }
  } else if (enter[0] > aabb[1][0]) {
    if (enter[1] > aabb[1][1]) {
      // right-top
      return sqDistanceToLineSegment(enter, exit, aabb[1]) < r2;
    } else if (enter[1] < aabb[0][1]) {
      // right-bottom
      return (
        sqDistanceToLineSegment(
          enter,
          exit,
          vec2.fromValues(aabb[1][0], aabb[0][1])
        ) < r2
      );
    }
  }

  return true;
};

export const testCapsuleCapsule = (
  p0: Readonly<vec2>,
  p1: Readonly<vec2>,
  radius0: number,
  q0: Readonly<vec2>,
  q1: Readonly<vec2>,
  radius1: number
): boolean => {
  const c0 = vec2.create();
  const c1 = vec2.create();
  closestPointsBetweenLineSegments(c0, c1, p0, p1, q0, q1);

  const r = radius0 + radius1;
  return vec2.squaredDistance(c0, c1) < r * r;
};

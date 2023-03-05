import { mat3, vec2 } from 'gl-matrix';

import { affineInverse } from '../math';

import { AABB } from './aabb';

export class OBB {
  readonly invTransform = mat3.create();

  constructor(readonly extent: vec2, readonly transform: mat3) {
    affineInverse(this.invTransform, transform);
  }
}

export namespace OBB {
  const p0 = vec2.create();
  const p1 = vec2.create();
  const p2 = vec2.create();
  const p3 = vec2.create();

  const points = [p0, p1, p2, p3];

  export const testAABB = (
    aabb: Readonly<AABB>,
    obb: Readonly<OBB>,
    transform: Readonly<mat3>, // obb -> abb
    invTransform: Readonly<mat3> // abb -> obb
  ): boolean => {
    vec2.set(points[0], -obb.extent[0], -obb.extent[1]);
    vec2.set(points[1], obb.extent[0], -obb.extent[1]);
    vec2.set(points[2], obb.extent[0], obb.extent[1]);
    vec2.set(points[3], -obb.extent[0], obb.extent[1]);

    for (const point of points) {
      vec2.transformMat3(point, point, transform);
    }

    if (
      points.every(p => p[0] < aabb.min[0]) ||
      points.every(p => p[0] > aabb.max[0]) ||
      points.every(p => p[1] < aabb.min[1]) ||
      points.every(p => p[1] > aabb.max[1])
    ) {
      return false;
    }

    vec2.set(points[0], aabb.min[0], aabb.min[1]);
    vec2.set(points[1], aabb.max[0], aabb.min[1]);
    vec2.set(points[2], aabb.max[0], aabb.max[1]);
    vec2.set(points[3], aabb.min[0], aabb.max[1]);

    for (const point of points) {
      vec2.transformMat3(point, point, invTransform);
    }

    if (
      points.every(p => p[0] < -obb.extent[0]) ||
      points.every(p => p[0] > obb.extent[0]) ||
      points.every(p => p[1] < -obb.extent[1]) ||
      points.every(p => p[1] > obb.extent[1])
    ) {
      return false;
    }

    return true;
  };

  export const testOBB = (
    obb0: Readonly<OBB>,
    obb1: Readonly<OBB>,
    firstToSecondTransform: mat3, // obb0 -> obb1
    secondToFirstTransform: mat3 // obb1 -> obb0
  ): boolean => {
    vec2.set(points[0], -obb1.extent[0], -obb1.extent[1]);
    vec2.set(points[1], obb1.extent[0], -obb1.extent[1]);
    vec2.set(points[2], obb1.extent[0], obb1.extent[1]);
    vec2.set(points[3], -obb1.extent[0], obb1.extent[1]);

    for (const point of points) {
      vec2.transformMat3(point, point, secondToFirstTransform);
    }

    if (
      points.every(p => p[0] < -obb0.extent[0]) ||
      points.every(p => p[0] > obb0.extent[0]) ||
      points.every(p => p[1] < -obb0.extent[1]) ||
      points.every(p => p[1] > obb0.extent[1])
    ) {
      return false;
    }

    vec2.set(points[0], -obb0.extent[0], -obb0.extent[1]);
    vec2.set(points[1], obb0.extent[0], -obb0.extent[1]);
    vec2.set(points[2], obb0.extent[0], obb0.extent[1]);
    vec2.set(points[3], -obb0.extent[0], obb0.extent[1]);

    for (const point of points) {
      vec2.transformMat3(point, point, firstToSecondTransform);
    }

    if (
      points.every(p => p[0] < -obb1.extent[0]) ||
      points.every(p => p[0] > obb1.extent[0]) ||
      points.every(p => p[1] < -obb1.extent[1]) ||
      points.every(p => p[1] > obb1.extent[1])
    ) {
      return false;
    }

    return true;
  };
}

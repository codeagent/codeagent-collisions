import { mat3, vec2 } from 'gl-matrix';
import { AABB } from '../aabb';

export interface Convex {
  /**
   * @param out result will be placed here
   * @param dir normalized direction to search support point along
   * @returns support point on local frame of reference
   */
  support(out: vec2, dir: Readonly<vec2>, margin?: number): vec2;
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
  aabb(out: AABB, transform: Readonly<mat3>): AABB;
}

export interface CircleBounded {
  /**
   * @field radius of shpere
   */
  readonly radius: number;
}

export interface MassDistribution {
  /**
   * @param mass mass of the shape
   * @returns calculated moment of inertia for given mass of this shape
   */
  inetria(mass: number): number;
}

export interface Shape extends Convex, TestTarget, AABBBounded, CircleBounded {}

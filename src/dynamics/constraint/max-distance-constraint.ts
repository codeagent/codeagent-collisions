import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { DistanceConstraint } from '../constraint';
import { Body } from '../body';

export class MaxDistanceConstraint extends DistanceConstraint {
  constructor(
    world: World,
    bodyA: Body,
    jointA: vec2,
    bodyB: Body,
    jointB: vec2,
    distance: number
  ) {
    super(world, bodyA, jointA, bodyB, jointB, distance);
  }

  getPushFactor(dt: number, strength = 1.0): number {
    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    const violation = this.distance - vec2.distance(pb, pa);
    // violation < 0 means constraint is broken
    return violation > 0 ? violation / dt : (strength * violation) / dt;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: 0 };
  }
}

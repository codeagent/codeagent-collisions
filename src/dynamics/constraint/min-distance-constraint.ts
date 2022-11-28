import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { DistanceConstraint } from '../constraint';
import { Body } from '../body';

export class MinDistanceConstraint extends DistanceConstraint {
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
    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    const violation = this.distance - vec2.distance(this.pb, this.pa);

    // violation > 0 means constraint is broken
    return violation < 0 ? violation / dt : (strength * violation) / dt;
  }

  getClamping() {
    return { min: 0, max: Number.POSITIVE_INFINITY };
  }
}

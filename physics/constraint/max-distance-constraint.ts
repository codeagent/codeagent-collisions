import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { DistanceConstraint } from '../constraint';

export class MaxDistanceConstraint extends DistanceConstraint {
  constructor(
    world: World,
    bodyAIndex: number,
    jointA: vec2,
    bodyBIndex: number,
    jointB: vec2,
    distance: number
  ) {
    super(world, bodyAIndex, jointA, bodyBIndex, jointB, distance);
  }

  getPushFactor(dt: number, strength = 1.0): number {
    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    const violation = this.distance - vec2.distance(pb, pa);
    return violation > 0 ? violation / dt : (strength * violation) / dt;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: 0 };
  }
}

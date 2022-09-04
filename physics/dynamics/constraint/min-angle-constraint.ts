import { World } from '../world';
import { AngleConstraint } from './angle-constraint';
import { Body } from '../body';

export class MinAngleConstraint extends AngleConstraint {
  constructor(world: World, bodyA: Body, bodyB: Body, angle: number) {
    super(world, bodyA, bodyB, angle);
  }

  getPushFactor(dt: number, strength: number): number {
    const violation = this.angle - (this.bodyB.angle - this.bodyA.angle);
    // violation > 0 means constraint is broken
    return violation < 0 ? violation / dt : (strength * violation) / dt;
  }

  getClamping() {
    return { min: 0, max: Number.POSITIVE_INFINITY };
  }
}

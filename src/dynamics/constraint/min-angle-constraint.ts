import { AngleConstraint } from './angle-constraint';

export class MinAngleConstraint extends AngleConstraint {
  getPushFactor(dt: number): number {
    const violation = this.angle - (this.bodyB.angle - this.bodyA.angle);
    // violation > 0 means constraint is broken
    return violation < 0 ? violation / dt : 0;
  }

  getClamping() {
    return { min: 0, max: Number.POSITIVE_INFINITY };
  }
}

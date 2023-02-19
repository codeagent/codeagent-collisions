import { ConstraintClamping } from '../types';

import { AngleConstraint } from './angle-constraint';

export class MaxAngleConstraint extends AngleConstraint {
  getPushFactor(dt: number): number {
    const violation = this.angle - (this.bodyB.angle - this.bodyA.angle);

    // violation < 0 means constraint is broken
    return violation > 0 ? violation / dt : 0;
  }

  getClamping(): ConstraintClamping {
    return { min: Number.NEGATIVE_INFINITY, max: 0 };
  }
}

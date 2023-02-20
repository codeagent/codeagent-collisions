import { vec2 } from 'gl-matrix';

import { DistanceConstraint } from '../constraint';
import { ConstraintClamping } from '../types';

export class MinDistanceConstraint extends DistanceConstraint {
  getPushFactor(dt: number, strength = 1.0): number {
    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    const violation = this.distance - vec2.distance(this.pb, this.pa);

    // violation > 0 means constraint is broken
    return violation < 0 ? violation / dt : (strength * violation) / dt;
  }

  getClamping(): ConstraintClamping {
    return { min: 0, max: this.world.settings.constraintMaxForce };
  }
}

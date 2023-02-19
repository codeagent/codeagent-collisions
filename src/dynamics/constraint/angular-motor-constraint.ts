import { BodyInterface, ConstraintClamping, WorldInterface } from '../types';

import { ConstraintBase } from './constraint.base';

export class AngularMotorConstraint extends ConstraintBase {
  constructor(
    readonly world: WorldInterface,
    readonly bodyA: BodyInterface,
    readonly speed: number,
    readonly torque: number
  ) {
    super();
  }

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    if (isFinite(this.bodyA.inertia)) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 1;
    }
  }

  getPushFactor(): number {
    return this.speed;
  }

  getClamping(): ConstraintClamping {
    return { min: -this.torque, max: this.torque };
  }
}

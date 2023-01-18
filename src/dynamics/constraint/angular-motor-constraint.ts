import { BodyInterface } from '../body.interface';
import { WorldInterface } from '../world.interface';

import { ConstraintBase } from './constraint.base';

export class AngularMotorConstraint extends ConstraintBase {
  constructor(
    public readonly world: WorldInterface,
    public readonly bodyA: BodyInterface,
    public readonly speed: number,
    public readonly torque: number
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

  getClamping() {
    return { min: -this.torque, max: this.torque };
  }
}

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class AngularMotorConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly speed: number,
    public readonly torque: number
  ) {
    super();
  }

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);
    jacobian.fill(0.0);

    if (isFinite(this.bodyA.inertia)) {
      const bodyIndex = this.bodyA.bodyIndex;
      jacobian[bodyIndex * 3] = 0;
      jacobian[bodyIndex * 3 + 1] = 0;
      jacobian[bodyIndex * 3 + 2] = 1;
    }
  }

  getPushFactor(dt: number, strength: number): number {
    return this.speed;
  }

  getClamping() {
    return { min: -this.torque, max: this.torque };
  }
}

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class AngularMotorConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly body: Body,
    public readonly speed: number,
    public readonly torque: number
  ) {
    super();
  }

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);
    jacobian.fill(0.0);

    if (isFinite(this.body.inertia)) {
      const bodyIndex = this.world.bodyIndex.get(this.body);
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

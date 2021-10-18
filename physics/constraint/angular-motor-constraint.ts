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

  getJacobian(values: number[], columns: number[]): number {
    // const jacobian = out.subarray(offset, offset + length);
    // jacobian.fill(0.0);

    let written = 0;
    if (isFinite(this.body.inertia)) {
      const bodyIndex = this.world.bodyIndex.get(this.body);
      // jacobian[bodyIndex * 3] = 0;
      // jacobian[bodyIndex * 3 + 1] = 0;
      // jacobian[bodyIndex * 3 + 2] = 1;
      values.push(1);
      columns.push(bodyIndex * 3 + 2);
      written++;
    }

    return written;
  }

  getPushFactor(dt: number, strength: number): number {
    return this.speed;
  }

  getClamping() {
    return { min: -this.torque, max: this.torque };
  }
}

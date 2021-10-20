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
    if (isFinite(this.body.inertia)) {
      values.push(1);
      columns.push(this.world.bodyIndex.get(this.body) * 3 + 2);
      return 1;
    }

    return 0;
  }

  getPushFactor(dt: number, strength: number): number {
    return this.speed;
  }

  getClamping() {
    return { min: -this.torque, max: this.torque };
  }
}

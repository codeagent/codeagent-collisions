import { World } from '../world';
import { Vector } from '../solver';
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

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    if (isFinite(this.body.inertia)) {
      const bodyIndex = this.world.bodyIndex.get(this.body);

      J[bodyIndex * 3] = 0;
      J[bodyIndex * 3 + 1] = 0;
      J[bodyIndex * 3 + 2] = 1;
    }

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    return this.speed;
  }

  getClamping() {
    return { min: -this.torque, max: this.torque };
  }
}

import { World } from '../world';

import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class AngleConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly bodyB: Body,
    public readonly angle: number
  ) {
    super();
  }

  getJacobian(values: number[], columns: number[]): number {
    // const jacobian = out.subarray(offset, offset + length);
    // jacobian.fill(0.0);

    let written = 0;
    if (isFinite(this.bodyA.inertia)) {
      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);

      // jacobian[bodyAIndex * 3] = 0;
      // jacobian[bodyAIndex * 3 + 1] = 0;
      // jacobian[bodyAIndex * 3 + 2] = -1;
      values.push(-1);
      columns.push(bodyAIndex * 3 + 2);
      written++;
    }

    if (isFinite(this.bodyB.inertia)) {
      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      // jacobian[bodyBIndex * 3] = 0;
      // jacobian[bodyBIndex * 3 + 1] = 0;
      // jacobian[bodyBIndex * 3 + 2] = 1;

      values.push(1);
      columns.push(bodyBIndex * 3 + 2);
      written++;
    }

    return written;
  }

  getPushFactor(dt: number, strength: number): number {
    return (
      ((this.angle - (this.bodyB.angle - this.bodyA.angle)) / dt) * strength
    );
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

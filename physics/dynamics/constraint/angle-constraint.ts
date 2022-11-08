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

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);
    jacobian.fill(0.0);

    if (isFinite(this.bodyA.inertia)) {
      const bodyAIndex = this.bodyA.bodyIndex;
      jacobian[bodyAIndex * 3] = 0;
      jacobian[bodyAIndex * 3 + 1] = 0;
      jacobian[bodyAIndex * 3 + 2] = -1;
    }

    if (isFinite(this.bodyB.inertia)) {
      const bodyBIndex = this.bodyB.bodyIndex;
      jacobian[bodyBIndex * 3] = 0;
      jacobian[bodyBIndex * 3 + 1] = 0;
      jacobian[bodyBIndex * 3 + 2] = 1;
    }
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

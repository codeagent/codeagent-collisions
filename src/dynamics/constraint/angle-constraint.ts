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

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    if (isFinite(this.bodyA.inertia)) {
      out[0] = 0;
      out[1] = 0;
      out[2] = -1;
    }

    if (isFinite(this.bodyB.inertia)) {
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
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

import { BodyInterface, ConstraintClamping, WorldInterface } from '../types';

import { ConstraintBase } from './constraint.base';

export class SpiralSpringConstraint extends ConstraintBase {
  constructor(
    readonly world: WorldInterface,
    readonly bodyA: BodyInterface,
    readonly bodyB: BodyInterface,
    readonly angle: number,
    readonly stiffness: number,
    readonly extinction: number
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

  getPushFactor(): number {
    return 0.0;
  }

  getClamping(): ConstraintClamping {
    // Damping force
    const fd = -this.extinction * (this.bodyB.omega - this.bodyA.omega);

    // Stiff force
    const fs =
      this.stiffness * (this.angle - (this.bodyB.angle - this.bodyA.angle));

    const c = fs + fd;

    return { min: c, max: c };
  }
}

import { vec2, vec3 } from 'gl-matrix';

import { Body } from '../body';
import { World } from '../world';
import { Vector } from '../solver';
import { ConstraintBase } from './constraint.base';

export class FrictionConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly bodyB: Body,
    public readonly joint: vec2,
    public readonly normal: vec2, // normal at bodyA
    public readonly mu: number
  ) {
    super();
  }

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);
    jacobian.fill(0.0);

    const x = vec3.create();
    const normal = vec2.fromValues(-this.normal[1], this.normal[0]);

    if (!this.bodyA.isStatic) {
      const ra = vec2.create();
      vec2.sub(ra, this.joint, this.bodyA.position);

      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      jacobian[bodyAIndex * 3] = -normal[0];
      jacobian[bodyAIndex * 3 + 1] = -normal[1];
      jacobian[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, normal)[2];
    }

    if (!this.bodyB.isStatic) {
      const rb = vec2.create();
      vec2.sub(rb, this.joint, this.bodyB.position);

      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      jacobian[bodyBIndex * 3] = normal[0];
      jacobian[bodyBIndex * 3 + 1] = normal[1];
      jacobian[bodyBIndex * 3 + 2] = vec2.cross(x, rb, normal)[2];
    }
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    const m1 = this.bodyA.mass;
    const m2 = this.bodyB.mass;

    const combined =
      Number.isFinite(m1) && Number.isFinite(m2)
        ? 0.5 * (m1 + m2)
        : Number.isFinite(m1)
        ? m1
        : Number.isFinite(m2)
        ? m2
        : 0.0;

    const c1 = Math.abs(
      this.mu * combined * vec2.dot(this.world.gravity, this.normal)
    );

    return { min: -c1, max: c1 };
  }
}

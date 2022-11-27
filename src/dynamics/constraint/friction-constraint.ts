import { vec2 } from 'gl-matrix';

import { Body } from '../body';
import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { cross } from '../../math';

const normal = vec2.create();
const ra = vec2.create();
const rb = vec2.create();

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

    vec2.set(normal, -this.normal[1], this.normal[0]);

    if (!this.bodyA.isStatic) {
      vec2.sub(ra, this.joint, this.bodyA.position);

      const bodyAIndex = this.bodyA.bodyIndex;
      jacobian[bodyAIndex * 3] = -normal[0];
      jacobian[bodyAIndex * 3 + 1] = -normal[1];
      jacobian[bodyAIndex * 3 + 2] = -cross(ra, normal);
    }

    if (!this.bodyB.isStatic) {
      vec2.sub(rb, this.joint, this.bodyB.position);

      const bodyBIndex = this.bodyB.bodyIndex;
      jacobian[bodyBIndex * 3] = normal[0];
      jacobian[bodyBIndex * 3 + 1] = normal[1];
      jacobian[bodyBIndex * 3 + 2] = cross(rb, normal);
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
      this.mu * combined * vec2.dot(this.world.settings.gravity, this.normal)
    );

    return { min: -c1, max: c1 };
  }
}

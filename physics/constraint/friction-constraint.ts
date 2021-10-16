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

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
    const bodyBIndex = this.world.bodyIndex.get(this.bodyB);

    const ra = vec2.create();
    vec2.sub(ra, this.joint, this.bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, this.joint, this.bodyB.position);

    const x = vec3.create();
    const normal = vec2.fromValues(-this.normal[1], this.normal[0]);

    if (!this.bodyA.isStatic) {
      J[bodyAIndex * 3] = -normal[0];
      J[bodyAIndex * 3 + 1] = -normal[1];
      J[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, normal)[2];
    }

    if (!this.bodyB.isStatic) {
      J[bodyBIndex * 3] = normal[0];
      J[bodyBIndex * 3 + 1] = normal[1];
      J[bodyBIndex * 3 + 2] = vec2.cross(x, rb, normal)[2];
    }
    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
    const bodyBIndex = this.world.bodyIndex.get(this.bodyB);

    const m1 = this.world.bodies[bodyAIndex].mass;
    const m2 = this.world.bodies[bodyBIndex].mass;

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

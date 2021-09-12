import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';
import { ConstraintInterface } from './constraint.interface';

export class FrictionConstraint {
  constructor(
    public world: World,
    public bodyAIndex: number,
    public bodyBIndex: number,
    public joint: vec2,
    public normal: vec2, // normal at bodyA
    public mu: number
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const ra = vec2.create();
    vec2.sub(ra, this.joint, bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, this.joint, bodyB.position);

    const x = vec3.create();
    const normal = vec2.fromValues(-this.normal[1], this.normal[0]);

    J[this.bodyAIndex * 3] = -normal[0];
    J[this.bodyAIndex * 3 + 1] = -normal[1];
    J[this.bodyAIndex * 3 + 2] = -vec2.cross(x, ra, normal)[2];

    J[this.bodyBIndex * 3] = normal[0];
    J[this.bodyBIndex * 3 + 1] = normal[1];
    J[this.bodyBIndex * 3 + 2] = vec2.cross(x, rb, normal)[2];

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    const m1 = this.world.bodies[this.bodyAIndex].mass;
    const m2 = this.world.bodies[this.bodyBIndex].mass;

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

import { World } from '../world';
import { vec2, vec3 } from 'gl-matrix';

import { Vector, VxV } from '../solver';
import { ConstraintBase } from './constraint.base';

export class ContactConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyAIndex: number,
    public readonly bodyBIndex: number,
    public readonly joint: vec2,
    public readonly normal: vec2, // normal at bodyA
    public readonly penetration: number
  ) {
    super();
  }

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const ra = vec2.create();
    vec2.sub(ra, this.joint, bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, this.joint, bodyB.position);

    const x = vec3.create();

    J[this.bodyAIndex * 3] = -this.normal[0];
    J[this.bodyAIndex * 3 + 1] = -this.normal[1];
    J[this.bodyAIndex * 3 + 2] = -vec2.cross(x, ra, this.normal)[2];

    J[this.bodyBIndex * 3] = this.normal[0];
    J[this.bodyBIndex * 3 + 1] = this.normal[1];
    J[this.bodyBIndex * 3 + 2] = vec2.cross(x, rb, this.normal)[2];

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    return strength
      ? (this.penetration / dt) * strength
      : -VxV(this.getJacobian(), this.world.velocities) *
          this.world.restitution;
  }

  getClamping() {
    return { min: 0.0, max: Number.POSITIVE_INFINITY };
  }
}

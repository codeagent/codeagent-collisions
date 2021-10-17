import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { Vector, VxV } from '../solver';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class ContactConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly bodyB: Body,
    public readonly joint: vec2,
    public readonly normal: vec2, // normal at bodyA
    public readonly penetration: number
  ) {
    super();
  }

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const x = vec3.create();

    if (!this.bodyA.isStatic) {
      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);

      const ra = vec2.create();
      vec2.sub(ra, this.joint, this.bodyA.position);

      J[bodyAIndex * 3] = -this.normal[0];
      J[bodyAIndex * 3 + 1] = -this.normal[1];
      J[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, this.normal)[2];
    }

    if (!this.bodyB.isStatic) {
      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);

      const rb = vec2.create();
      vec2.sub(rb, this.joint, this.bodyB.position);

      J[bodyBIndex * 3] = this.normal[0];
      J[bodyBIndex * 3 + 1] = this.normal[1];
      J[bodyBIndex * 3 + 2] = vec2.cross(x, rb, this.normal)[2];
    }

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

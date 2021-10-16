import { World } from '../world';
import { vec2, vec3 } from 'gl-matrix';

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

    const bodyAIndex = this.world.bodyIndex.get(this.bodyA) ?? -1;
    const bodyBIndex = this.world.bodyIndex.get(this.bodyB) ?? -1;

    const ra = vec2.create();
    vec2.sub(ra, this.joint, this.bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, this.joint, this.bodyB.position);

    const x = vec3.create();

    if (!this.bodyA.isStatic && bodyAIndex >= 0) {
      J[bodyAIndex * 3] = -this.normal[0];
      J[bodyAIndex * 3 + 1] = -this.normal[1];
      J[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, this.normal)[2];
    }

    if (!this.bodyB.isStatic && bodyAIndex >= 0) {
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

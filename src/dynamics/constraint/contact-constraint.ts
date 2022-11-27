import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';
import { cross, VxV } from '../../math';

const ra = vec2.create();
const rb = vec2.create();

export class ContactConstraint extends ConstraintBase {
  private readonly jacobian = new Float32Array(6);
  private readonly velocities = new Float32Array(6);

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly bodyB: Body,
    public readonly joint: vec2,
    public readonly normal: vec2, // normal at bodyA
    public penetration: number
  ) {
    super();
  }

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);
    jacobian.fill(0.0);

    if (!this.bodyA.isStatic) {
      vec2.sub(ra, this.joint, this.bodyA.position);

      const bodyAIndex = this.bodyA.bodyIndex;
      this.jacobian[0] = jacobian[bodyAIndex * 3] = -this.normal[0];
      this.jacobian[1] = jacobian[bodyAIndex * 3 + 1] = -this.normal[1];
      this.jacobian[2] = jacobian[bodyAIndex * 3 + 2] = -cross(ra, this.normal);
    }

    if (!this.bodyB.isStatic) {
      vec2.sub(rb, this.joint, this.bodyB.position);

      const bodyBIndex = this.bodyB.bodyIndex;
      this.jacobian[3] = jacobian[bodyBIndex * 3] = this.normal[0];
      this.jacobian[4] = jacobian[bodyBIndex * 3 + 1] = this.normal[1];
      this.jacobian[5] = jacobian[bodyBIndex * 3 + 2] = cross(rb, this.normal);
    }
  }

  getPushFactor(dt: number, strength: number): number {
    if (strength) {
      return (
        (Math.max(
          this.penetration - this.world.settings.contactConstraintSlop,
          0
        ) /
          dt) *
        strength
      );
    } else {
      this.velocities.fill(0);
      this.velocities[0] = this.bodyA.velocity[0];
      this.velocities[1] = this.bodyA.velocity[1];
      this.velocities[2] = this.bodyA.omega;
      this.velocities[3] = this.bodyB.velocity[0];
      this.velocities[4] = this.bodyB.velocity[1];
      this.velocities[5] = this.bodyB.omega;
    }
    return (
      -VxV(this.velocities, this.jacobian) *
      this.world.settings.defaultRestitution
    );
  }

  getClamping() {
    return { min: 0.0, max: Number.POSITIVE_INFINITY };
  }

  setPenetration(penetration: number) {
    this.penetration = penetration;
  }
}

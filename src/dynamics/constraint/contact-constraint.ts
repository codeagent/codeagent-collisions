import { vec2 } from 'gl-matrix';

import { cross, VxV } from '../../math';
import { BodyInterface } from '../body.interface';
import { WorldInterface } from '../world.interface';

import { ConstraintBase } from './constraint.base';

const ra = vec2.create();
const rb = vec2.create();
const jacobian = new Float32Array(6);
const velocities = new Float32Array(6);

export class ContactConstraint extends ConstraintBase {
  constructor(
    public readonly world: WorldInterface,
    public readonly bodyA: Readonly<BodyInterface>,
    public readonly bodyB: Readonly<BodyInterface>,
    public readonly joint: Readonly<vec2>,
    public readonly normal: Readonly<vec2>, // normal at bodyA
    public penetration: number
  ) {
    super();
  }

  getJacobian(out: Float32Array): void {
    jacobian.fill(0.0);
    out.fill(0);

    vec2.sub(ra, this.joint, this.bodyA.position);

    jacobian[0] = out[0] = -this.normal[0];
    jacobian[1] = out[1] = -this.normal[1];
    jacobian[2] = out[2] = -cross(ra, this.normal);

    vec2.sub(rb, this.joint, this.bodyB.position);

    jacobian[3] = out[3] = this.normal[0];
    jacobian[4] = out[4] = this.normal[1];
    jacobian[5] = out[5] = cross(rb, this.normal);
  }

  getPushFactor(dt: number, strength: number): number {
    if (strength) {
      const penetration =
        this.penetration - this.world.settings.contactConstraintSlop;

      return (Math.max(penetration, 0) / dt) * strength;
    } else {
      const restitution = Math.min(
        this.bodyA.collider.material.restitution,
        this.bodyB.collider.material.restitution
      );

      return -this.getCDot() * restitution;
    }
  }

  getClamping() {
    return { min: 0.0, max: Number.POSITIVE_INFINITY };
  }

  setPenetration(penetration: number) {
    this.penetration = penetration;
  }

  private getCDot(): number {
    velocities.fill(0);
    velocities[0] = this.bodyA.velocity[0];
    velocities[1] = this.bodyA.velocity[1];
    velocities[2] = this.bodyA.omega;
    velocities[3] = this.bodyB.velocity[0];
    velocities[4] = this.bodyB.velocity[1];
    velocities[5] = this.bodyB.omega;
    return VxV(velocities, jacobian);
  }
}

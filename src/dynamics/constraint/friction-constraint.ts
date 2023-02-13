import { vec2 } from 'gl-matrix';

import { cross } from '../../math';
import { BodyInterface } from '../body.interface';
import { WorldInterface } from '../world.interface';

import { ConstraintBase } from './constraint.base';

const tangent = vec2.create();
const ra = vec2.create();
const rb = vec2.create();

export class FrictionConstraint extends ConstraintBase {
  constructor(
    public readonly world: WorldInterface,
    public readonly bodyA: BodyInterface,
    public readonly bodyB: BodyInterface,
    public readonly joint: vec2,
    public readonly normal: vec2, // normal at bodyA
    public readonly mu: number
  ) {
    super();
  }

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    vec2.set(tangent, -this.normal[1], this.normal[0]);

    vec2.sub(ra, this.joint, this.bodyA.position);
    out[0] = -tangent[0];
    out[1] = -tangent[1];
    out[2] = -cross(ra, tangent);

    vec2.sub(rb, this.joint, this.bodyB.position);
    out[3] = tangent[0];
    out[4] = tangent[1];
    out[5] = cross(rb, tangent);
  }

  getPushFactor(): number {
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

  patch(point: vec2, normal: vec2): void {
    vec2.copy(this.joint, point);
    vec2.copy(this.normal, normal);
  }
}

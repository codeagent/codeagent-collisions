import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';

export class HalfspaceConstraint {
  constructor(
    public world: World,
    public bodyIndex: number,
    public origin: vec2,
    public normal: vec2
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const p = this.world.bodies[this.bodyIndex].position;
    const op = vec2.create();
    vec2.subtract(op, p, this.origin);

    if (vec2.dot(this.normal, op) < 0) {
      J[this.bodyIndex * 3] = this.normal[0];
      J[this.bodyIndex * 3 + 1] = this.normal[1];
    }

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    const body = this.world.bodies[this.bodyIndex];
    const p = body.position;
    const op = vec2.create();
    vec2.subtract(op, p, this.origin);

    return strength
      ? (strength * -vec2.dot(this.normal, op)) / dt
      : -vec2.dot(body.velocity, this.normal) * this.world.restitution;
  }

  getClamping() {
    return { min: 0.0, max: Number.POSITIVE_INFINITY };
  }
}

import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';
import { closestPointToLineSegment } from '../collision';

export class LineConstraint {
  constructor(
    public world: World,
    public bodyIndex: number,
    public lineA: vec2,
    public lineB: vec2,
    public distance: number
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const n = vec2.create();
    vec2.subtract(n, this.lineB, this.lineA);
    vec2.set(n, -n[1], n[0]);
    vec2.normalize(n, n);

    J[this.bodyIndex * 3] = n[0];
    J[this.bodyIndex * 3 + 1] = n[1];

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    const n = vec2.create();
    vec2.subtract(n, this.lineB, this.lineA);
    vec2.set(n, -n[1], n[0]);
    vec2.normalize(n, n);

    const p = this.world.bodies[this.bodyIndex].position;
    const ph = vec2.create();
    closestPointToLineSegment(ph, this.lineA, this.lineB, p);

    const pph = vec2.create();
    vec2.subtract(pph, p, ph);

    return (strength * (this.distance - vec2.dot(n, pph))) / dt;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

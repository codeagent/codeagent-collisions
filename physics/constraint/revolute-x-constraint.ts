import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';

export class RevoluteXConstraint {
  constructor(
    public readonly world: World,
    public readonly bodyAIndex: number,
    public readonly jointA: vec2,
    public readonly bodyBIndex: number,
    public readonly jointB: vec2
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    const ra = vec2.create();
    vec2.sub(ra, pa, bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, pb, bodyB.position);

    J[this.bodyAIndex * 3] = 1;
    J[this.bodyAIndex * 3 + 1] = 0;
    J[this.bodyAIndex * 3 + 2] = -ra[1];

    J[this.bodyBIndex * 3] = -1;
    J[this.bodyBIndex * 3 + 1] = 0;
    J[this.bodyBIndex * 3 + 2] = rb[1];

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    return -((pa[0] - pb[0]) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

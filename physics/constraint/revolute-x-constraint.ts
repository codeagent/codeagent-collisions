import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class RevoluteXConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly jointA: vec2,
    public readonly bodyB: Body,
    public readonly jointB: vec2
  ) {
    super();
  }

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    if (!this.bodyA.isStatic) {
      const pa = vec2.create();
      vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

      const ra = vec2.create();
      vec2.sub(ra, pa, this.bodyA.position);

      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      J[bodyAIndex * 3] = 1;
      J[bodyAIndex * 3 + 1] = 0;
      J[bodyAIndex * 3 + 2] = -ra[1];
    }

    if (!this.bodyB.isStatic) {
      const pb = vec2.create();
      vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

      const rb = vec2.create();
      vec2.sub(rb, pb, this.bodyB.position);

      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      J[bodyBIndex * 3] = -1;
      J[bodyBIndex * 3 + 1] = 0;
      J[bodyBIndex * 3 + 2] = rb[1];
    }

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    return -((pa[0] - pb[0]) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

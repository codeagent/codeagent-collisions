import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class RevoluteYConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly jointA: vec2,
    public readonly bodyB: Body,
    public readonly jointB: vec2
  ) {
    super();
  }

  getJacobian(values: number[], columns: number[]): number {
    // const jacobian = out.subarray(offset, offset + length);
    // jacobian.fill(0.0);

    let written = 0;
    if (!this.bodyA.isStatic) {
      const pa = vec2.create();
      vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

      const ra = vec2.create();
      vec2.sub(ra, pa, this.bodyA.position);

      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      // jacobian[bodyAIndex * 3] = 0;
      // jacobian[bodyAIndex * 3 + 1] = 1;
      // jacobian[bodyAIndex * 3 + 2] = ra[0];
      values.push(1, ra[0]);
      columns.push(bodyAIndex * 3 + 1, bodyAIndex * 3 + 2);
      written += 2;
    }

    if (!this.bodyB.isStatic) {
      const pb = vec2.create();
      vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

      const rb = vec2.create();
      vec2.sub(rb, pb, this.bodyB.position);

      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      // jacobian[bodyBIndex * 3] = 0;
      // jacobian[bodyBIndex * 3 + 1] = -1;
      // jacobian[bodyBIndex * 3 + 2] = -rb[0];
      values.push(-1 - rb[0]);
      columns.push(bodyBIndex * 3 + 1, bodyBIndex * 3 + 2);
      written += 3;
    }
    return written;
  }

  getPushFactor(dt: number, strength: number): number {
    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    return -((pa[1] - pb[1]) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

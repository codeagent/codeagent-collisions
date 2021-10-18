import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class DistanceConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly jointA: vec2,
    public readonly bodyB: Body,
    public readonly jointB: vec2,
    public readonly distance: number
  ) {
    super();
  }

  getJacobian(values: number[], columns: number[]): number {
    // const jacobian = out.subarray(offset, offset + length);
    // jacobian.fill(0.0);

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    let written = 0;
    const pbpa = vec2.create();
    vec2.sub(pbpa, pb, pa);
    vec2.normalize(pbpa, pbpa);
    const x = vec3.create();

    if (!this.bodyA.isStatic) {
      const ra = vec2.create();
      vec2.sub(ra, pa, this.bodyA.position);

      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      // jacobian[bodyAIndex * 3] = -pbpa[0];
      // jacobian[bodyAIndex * 3 + 1] = -pbpa[1];
      // jacobian[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, pbpa)[2];

      values.push(-pbpa[0], -pbpa[1], -vec2.cross(x, ra, pbpa)[2]);
      columns.push(bodyAIndex * 3, bodyAIndex * 3 + 1, bodyAIndex * 3 + 2);
      written += 3;
    }

    if (!this.bodyB.isStatic) {
      const rb = vec2.create();
      vec2.sub(rb, pb, this.bodyB.position);

      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      // jacobian[bodyBIndex * 3] = pbpa[0];
      // jacobian[bodyBIndex * 3 + 1] = pbpa[1];
      // jacobian[bodyBIndex * 3 + 2] = vec2.cross(x, rb, pbpa)[2];

      values.push(pbpa[0], pbpa[1], vec2.cross(x, rb, pbpa)[2]);
      columns.push(bodyBIndex * 3, bodyBIndex * 3 + 1, bodyBIndex * 3 + 2);
      written += 3;
    }

    return written;
  }

  getPushFactor(dt: number, strength = 1.0): number {
    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    return ((this.distance - vec2.distance(pb, pa)) * strength) / dt;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

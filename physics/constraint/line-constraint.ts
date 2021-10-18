import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';
import { transformMat3Vec } from '../collision/utils';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class LineConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly jointA: vec2,
    public readonly bodyB: Body,
    public readonly jointB: vec2,
    public readonly axisA: vec2
  ) {
    super();
  }

  getJacobian(values: number[], columns: number[]): number {
    // const jacobian = out.subarray(offset, offset + length);
    // jacobian.fill(0.0);

    const t = vec2.create();
    transformMat3Vec(
      t,
      vec2.fromValues(-this.axisA[1], this.axisA[0]),
      this.bodyA.transform
    );

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    const x = vec3.create();

    let written = 0;
    if (!this.bodyA.isStatic) {
      const pa = vec2.create();
      vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

      const u = vec2.create();
      vec2.sub(u, pb, pa);

      const ra = vec2.create();
      vec2.sub(ra, pa, this.bodyA.position);
      vec2.add(ra, ra, u);

      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      // jacobian[bodyAIndex * 3] = -t[0];
      // jacobian[bodyAIndex * 3 + 1] = -t[1];
      // jacobian[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, t)[2];

      values.push(-t[0], -t[1], -vec2.cross(x, ra, t)[2]);
      columns.push(bodyAIndex * 3, bodyAIndex * 3 + 1, bodyAIndex * 3 + 2);
      written += 3;
    }

    if (!this.bodyB.isStatic) {
      const rb = vec2.create();
      vec2.sub(rb, pb, this.bodyB.position);

      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      // jacobian[bodyBIndex * 3] = t[0];
      // jacobian[bodyBIndex * 3 + 1] = t[1];
      // jacobian[bodyBIndex * 3 + 2] = vec2.cross(x, rb, t)[2];

      values.push(t[0], t[1], vec2.cross(x, rb, t)[2]);
      columns.push(bodyBIndex * 3, bodyBIndex * 3 + 1, bodyBIndex * 3 + 2);
      written += 3;
    }

    return written;
  }

  getPushFactor(dt: number, strength: number): number {
    const t = vec2.create();
    transformMat3Vec(
      t,
      vec2.fromValues(-this.axisA[1], this.axisA[0]),
      this.bodyA.transform
    );

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    const u = vec2.create();
    vec2.sub(u, pb, pa);

    return -(vec2.dot(t, u) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

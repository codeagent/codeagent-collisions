import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { Vector } from '../solver';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class SpringConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly jointA: vec2,
    public readonly bodyB: Body,
    public readonly jointB: vec2,
    public readonly length: number,
    public readonly stiffness: number,
    public readonly extinction: number
  ) {
    super();
  }

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);
    jacobian.fill(0.0);

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    const pbpa = vec2.create();
    vec2.sub(pbpa, pb, pa);
    vec2.normalize(pbpa, pbpa);
    const x = vec3.create();

    if (!this.bodyA.isStatic) {
      const ra = vec2.create();
      vec2.sub(ra, pa, this.bodyA.position);

      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      jacobian[bodyAIndex * 3] = -pbpa[0];
      jacobian[bodyAIndex * 3 + 1] = -pbpa[1];
      jacobian[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, pbpa)[2];
    }

    if (!this.bodyB.isStatic) {
      const rb = vec2.create();
      vec2.sub(rb, pb, this.bodyB.position);

      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      jacobian[bodyBIndex * 3] = pbpa[0];
      jacobian[bodyBIndex * 3 + 1] = pbpa[1];
      jacobian[bodyBIndex * 3 + 2] = vec2.cross(x, rb, pbpa)[2];
    }
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    const ra = vec2.create();
    vec2.sub(ra, pa, this.bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, pb, this.bodyB.position);

    const n = vec2.create();
    vec2.sub(n, pb, pa);
    const distance = vec2.length(n);
    vec2.scale(n, n, 1.0 / distance);

    const va = vec2.clone(this.bodyA.velocity);
    vec2.scaleAndAdd(va, va, vec2.fromValues(-ra[1], ra[0]), this.bodyA.omega);

    const vb = vec2.clone(this.bodyB.velocity);
    vec2.scaleAndAdd(vb, vb, vec2.fromValues(-rb[1], rb[0]), this.bodyB.omega);

    // Damping force
    const fd = this.extinction * (vec2.dot(n, va) - vec2.dot(n, vb));

    // Stiff force
    const fs = this.stiffness * (this.length - distance);

    const c = fs + fd;

    return { min: c, max: c };
  }
}

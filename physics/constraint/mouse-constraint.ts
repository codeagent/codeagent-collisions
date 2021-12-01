import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { MouseControlInterface } from '../mouse-control.interface';

export class MouseConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly joint: vec2,
    public readonly control: MouseControlInterface,
    public readonly stiffness: number,
    public readonly extinction: number
  ) {
    super();
  }

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);
    jacobian.fill(0.0);

    if (!this.control.body.isStatic) {
      const pa = vec2.create();
      vec2.transformMat3(pa, this.joint, this.control.body.transform);

      const pb = vec2.create();
      vec2.copy(pb, this.control.cursor);

      const pbpa = vec2.create();
      vec2.sub(pbpa, pb, pa);
      vec2.normalize(pbpa, pbpa);
      const x = vec3.create();

      const ra = vec2.create();
      vec2.sub(ra, pa, this.control.body.position);

      const bodyAIndex = this.world.bodyIndex.get(this.control.body);
      jacobian[bodyAIndex * 3] = -pbpa[0];
      jacobian[bodyAIndex * 3 + 1] = -pbpa[1];
      jacobian[bodyAIndex * 3 + 2] = -vec2.cross(x, ra, pbpa)[2];
    }
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    const pa = vec2.create();
    vec2.transformMat3(pa, this.joint, this.control.body.transform);

    const pb = vec2.create();
    vec2.copy(pb, this.control.cursor);

    const ra = vec2.create();
    vec2.sub(ra, pa, this.control.body.position);

    const n = vec2.create();
    vec2.sub(n, pb, pa);
    const distance = vec2.length(n);
    vec2.scale(n, n, 1.0 / distance);

    const va = vec2.clone(this.control.body.velocity);
    vec2.scaleAndAdd(
      va,
      va,
      vec2.fromValues(-ra[1], ra[0]),
      this.control.body.omega
    );

    // Damping force
    const fd = this.extinction * vec2.dot(n, va);

    // Stiff force
    const fs = this.stiffness * (0 - distance);

    const c = fs + fd;

    return { min: c, max: c };
  }
}

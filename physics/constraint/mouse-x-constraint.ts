import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { MouseControlInterface } from '../mouse-control.interface';

export class MouseXConstraint extends ConstraintBase {
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

    if (!this.control.body.isStatic) {
      const pa = vec2.create();
      vec2.transformMat3(pa, this.joint, this.control.body.transform);

      const ra = vec2.create();
      vec2.sub(ra, pa, this.control.body.position);

      const bodyAIndex = this.world.bodyIndex.get(this.control.body);
      jacobian[bodyAIndex * 3] = 1;
      jacobian[bodyAIndex * 3 + 1] = 0;
      jacobian[bodyAIndex * 3 + 2] = -ra[1];
    }
  }

  getPushFactor(dt: number, strength: number): number {
    const pa = vec2.create();
    vec2.transformMat3(pa, this.joint, this.control.body.transform);

    return -((pa[0] - this.control.cursor[0]) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

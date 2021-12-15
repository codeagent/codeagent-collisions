import { vec2 } from 'gl-matrix';

import { Body } from '../body';
import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { MouseControlInterface } from '../mouse-control.interface';

export class MouseYConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly body: Body,
    public readonly joint: vec2,
    public readonly control: MouseControlInterface,
    public readonly stiffness: number,
    public readonly maxForce: number = Number.POSITIVE_INFINITY
  ) {
    super();
  }

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);

    if (!this.body.isStatic) {
      const pa = vec2.create();
      vec2.transformMat3(pa, this.joint, this.body.transform);

      const ra = vec2.create();
      vec2.sub(ra, pa, this.body.position);

      const bodyAIndex = this.world.bodyIndex.get(this.body);
      jacobian[bodyAIndex * 3] = 0;
      jacobian[bodyAIndex * 3 + 1] = 1;
      jacobian[bodyAIndex * 3 + 2] = ra[0];
    }
  }

  getPushFactor(dt: number, strength: number): number {
    const pa = vec2.create();
    const cursor = this.control.getCursorPosition();
    vec2.transformMat3(pa, this.joint, this.body.transform);
    return -((pa[1] - cursor[1]) / dt) * this.stiffness;
  }

  getClamping() {
    return { min: -this.maxForce, max: this.maxForce };
  }
}

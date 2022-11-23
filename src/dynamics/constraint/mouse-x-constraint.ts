import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { Body } from '../body';
import { ConstraintBase } from './constraint.base';
import { MouseControlInterface } from '../joint';

export class MouseXConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly joint: vec2,
    public readonly control: MouseControlInterface,
    public readonly stiffness: number,
    public readonly maxForce: number = Number.POSITIVE_INFINITY
  ) {
    super();
  }

  getJacobian(out: Float32Array, offset: number, length: number): void {
    const jacobian = out.subarray(offset, offset + length);

    if (!this.bodyA.isStatic) {
      const pa = vec2.create();
      vec2.transformMat3(pa, this.joint, this.bodyA.transform);

      const ra = vec2.create();
      vec2.sub(ra, pa, this.bodyA.position);

      const bodyAIndex = this.bodyA.bodyIndex;
      jacobian[bodyAIndex * 3] = 1;
      jacobian[bodyAIndex * 3 + 1] = 0;
      jacobian[bodyAIndex * 3 + 2] = -ra[1];
    }
  }

  getPushFactor(dt: number, strength: number): number {
    const pa = vec2.create();
    const cursor = this.control.getCursorPosition();
    vec2.transformMat3(pa, this.joint, this.bodyA.transform);
    return -((pa[0] - cursor[0]) / dt) * this.stiffness;
  }

  getClamping() {
    return { min: -this.maxForce, max: this.maxForce };
  }
}

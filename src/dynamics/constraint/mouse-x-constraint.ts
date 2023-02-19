import { vec2 } from 'gl-matrix';

import {
  BodyInterface,
  WorldInterface,
  MouseControlInterface,
  ConstraintClamping,
} from '../types';

import { ConstraintBase } from './constraint.base';

export class MouseXConstraint extends ConstraintBase {
  private readonly pa = vec2.create();

  private readonly ra = vec2.create();

  private readonly cursor = vec2.create();

  constructor(
    readonly world: WorldInterface,
    readonly bodyA: BodyInterface,
    readonly joint: Readonly<vec2>,
    readonly control: MouseControlInterface,
    readonly stiffness: number,
    readonly maxForce: number = Number.POSITIVE_INFINITY
  ) {
    super();
  }

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    vec2.transformMat3(this.pa, this.joint, this.bodyA.transform);
    vec2.sub(this.ra, this.pa, this.bodyA.position);

    out[0] = 1;
    out[1] = 0;
    out[2] = -this.ra[1];
  }

  getPushFactor(dt: number): number {
    this.control.getCursorPosition(this.cursor);
    vec2.transformMat3(this.pa, this.joint, this.bodyA.transform);

    return -((this.pa[0] - this.cursor[0]) / dt) * this.stiffness;
  }

  getClamping(): ConstraintClamping {
    return { min: -this.maxForce, max: this.maxForce };
  }
}

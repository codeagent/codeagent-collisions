import { vec2 } from 'gl-matrix';

import { ConstraintBase } from './constraint.base';
import { MouseControlInterface } from '../joint';
import { BodyInterface } from '../body.interface';
import { WorldInterface } from '../world.interface';

export class MouseXConstraint extends ConstraintBase {
  private readonly pa = vec2.create();
  private readonly ra = vec2.create();

  private readonly cursor = vec2.create();

  constructor(
    public readonly world: WorldInterface,
    public readonly bodyA: BodyInterface,
    public readonly joint: Readonly<vec2>,
    public readonly control: MouseControlInterface,
    public readonly stiffness: number,
    public readonly maxForce: number = Number.POSITIVE_INFINITY
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

  getPushFactor(dt: number, strength: number): number {
    this.control.getCursorPosition(this.cursor);
    vec2.transformMat3(this.pa, this.joint, this.bodyA.transform);

    return -((this.pa[0] - this.cursor[0]) / dt) * this.stiffness;
  }

  getClamping() {
    return { min: -this.maxForce, max: this.maxForce };
  }
}

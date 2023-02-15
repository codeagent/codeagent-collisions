import { vec2 } from 'gl-matrix';

import { BodyInterface, WorldInterface } from '../types';

import { ConstraintBase } from './constraint.base';

export class RevoluteYConstraint extends ConstraintBase {
  private readonly pa = vec2.create();

  private readonly pb = vec2.create();

  private readonly ra = vec2.create();

  private readonly rb = vec2.create();

  constructor(
    public readonly world: WorldInterface,
    public readonly bodyA: BodyInterface,
    public readonly jointA: vec2,
    public readonly bodyB: BodyInterface,
    public readonly jointB: vec2
  ) {
    super();
  }

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.sub(this.ra, this.pa, this.bodyA.position);

    out[0] = 0;
    out[1] = 1;
    out[2] = this.ra[0];

    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);
    vec2.sub(this.rb, this.pb, this.bodyB.position);

    out[3] = 0;
    out[4] = -1;
    out[5] = -this.rb[0];
  }

  getPushFactor(dt: number, strength: number): number {
    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    return -((this.pa[1] - this.pb[1]) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

import { vec2 } from 'gl-matrix';

import { BodyInterface, ConstraintClamping, WorldInterface } from '../types';

import { ConstraintBase } from './constraint.base';

export class RevoluteXConstraint extends ConstraintBase {
  private readonly pa = vec2.create();

  private readonly pb = vec2.create();

  private readonly ra = vec2.create();

  private readonly rb = vec2.create();

  constructor(
    readonly world: WorldInterface,
    readonly bodyA: BodyInterface,
    readonly jointA: vec2,
    readonly bodyB: BodyInterface,
    readonly jointB: vec2
  ) {
    super();
  }

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.sub(this.ra, this.pa, this.bodyA.position);

    out[0] = 1;
    out[1] = 0;
    out[2] = -this.ra[1];

    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);
    vec2.sub(this.rb, this.pb, this.bodyB.position);

    out[3] = -1;
    out[4] = 0;
    out[5] = this.rb[1];
  }

  getPushFactor(dt: number, strength: number): number {
    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    return -((this.pa[0] - this.pb[0]) / dt) * strength;
  }

  getClamping(): ConstraintClamping {
    return {
      min: -this.world.settings.constraintMaxForce,
      max: this.world.settings.constraintMaxForce,
    };
  }
}

import { vec2 } from 'gl-matrix';

import { cross, transformMat3Vec } from '../../math';
import { BodyInterface } from '../body.interface';
import { WorldInterface } from '../world.interface';

import { ConstraintBase } from './constraint.base';

export class LineConstraint extends ConstraintBase {
  private readonly tangent = vec2.create();

  private readonly pa = vec2.create();

  private readonly pb = vec2.create();

  private readonly u = vec2.create();

  private readonly ra = vec2.create();

  private readonly rb = vec2.create();

  constructor(
    public readonly world: WorldInterface,
    public readonly bodyA: BodyInterface,
    public readonly jointA: vec2,
    public readonly bodyB: BodyInterface,
    public readonly jointB: vec2,
    public readonly axisA: vec2
  ) {
    super();
  }

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    vec2.set(this.tangent, -this.axisA[1], this.axisA[0]);
    transformMat3Vec(this.tangent, this.tangent, this.bodyA.transform);

    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);
    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);

    vec2.sub(this.u, this.pb, this.pa);

    vec2.sub(this.ra, this.pa, this.bodyA.position);
    vec2.add(this.ra, this.ra, this.u);

    out[0] = -this.tangent[0];
    out[1] = -this.tangent[1];
    out[2] = -cross(this.ra, this.tangent);

    vec2.sub(this.rb, this.pb, this.bodyB.position);

    out[3] = this.tangent[0];
    out[4] = this.tangent[1];
    out[5] = cross(this.rb, this.tangent);
  }

  getPushFactor(dt: number, strength: number): number {
    vec2.set(this.tangent, -this.axisA[1], this.axisA[0]);
    transformMat3Vec(this.tangent, this.tangent, this.bodyA.transform);

    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    vec2.sub(this.u, this.pb, this.pa);

    return -(vec2.dot(this.tangent, this.u) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

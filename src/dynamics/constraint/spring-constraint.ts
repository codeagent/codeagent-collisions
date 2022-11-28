import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';
import { cross } from '../../math';

export class SpringConstraint extends ConstraintBase {
  private readonly pa = vec2.create();
  private readonly pb = vec2.create();
  private readonly ra = vec2.create();
  private readonly rb = vec2.create();
  private readonly va = vec2.create();
  private readonly vb = vec2.create();
  private readonly pbpa = vec2.create();
  private readonly normal = vec2.create();

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

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    vec2.sub(this.pbpa, this.pb, this.pa);
    vec2.normalize(this.pbpa, this.pbpa);

    vec2.sub(this.ra, this.pa, this.bodyA.position);

    out[0] = -this.pbpa[0];
    out[1] = -this.pbpa[1];
    out[2] = -cross(this.ra, this.pbpa);

    vec2.sub(this.rb, this.pb, this.bodyB.position);

    out[3] = this.pbpa[0];
    out[4] = this.pbpa[1];
    out[5] = cross(this.rb, this.pbpa);
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    vec2.sub(this.ra, this.pa, this.bodyA.position);
    vec2.set(this.ra, -this.ra[1], this.ra[0]);

    vec2.sub(this.rb, this.pb, this.bodyB.position);
    vec2.set(this.rb, -this.rb[1], this.rb[0]);

    vec2.sub(this.normal, this.pb, this.pa);
    const distance = vec2.length(this.normal);
    vec2.scale(this.normal, this.normal, 1.0 / distance);

    vec2.copy(this.va, this.bodyA.velocity);
    vec2.scaleAndAdd(this.va, this.va, this.ra, this.bodyA.omega);

    vec2.copy(this.vb, this.bodyB.velocity);
    vec2.scaleAndAdd(this.vb, this.vb, this.rb, this.bodyB.omega);

    // Damping force
    const fd =
      this.extinction *
      (vec2.dot(this.normal, this.va) - vec2.dot(this.normal, this.vb));

    // Stiff force
    const fs = this.stiffness * (this.length - distance);

    const c = fs + fd;

    return { min: c, max: c };
  }
}

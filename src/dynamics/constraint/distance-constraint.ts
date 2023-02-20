import { vec2 } from 'gl-matrix';

import { cross } from '../../math';
import { BodyInterface, ConstraintClamping, WorldInterface } from '../types';

import { ConstraintBase } from './constraint.base';

export class DistanceConstraint extends ConstraintBase {
  protected readonly pa = vec2.create();

  protected readonly pb = vec2.create();

  protected readonly pbpa = vec2.create();

  protected readonly ra = vec2.create();

  protected readonly rb = vec2.create();

  constructor(
    readonly world: WorldInterface,
    readonly bodyA: BodyInterface,
    readonly jointA: vec2,
    readonly bodyB: BodyInterface,
    readonly jointB: vec2,
    readonly distance: number
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

  getPushFactor(dt: number, strength = 1.0): number {
    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    return ((this.distance - vec2.distance(this.pb, this.pa)) * strength) / dt;
  }

  getClamping(): ConstraintClamping {
    return {
      min: -this.world.settings.constraintMaxForce,
      max: this.world.settings.constraintMaxForce,
    };
  }
}

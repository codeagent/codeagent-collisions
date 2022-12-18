import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';
import { VxV, cross } from '../../math';

export class DistanceConstraint extends ConstraintBase {
  protected readonly pa = vec2.create();
  protected readonly pb = vec2.create();
  protected readonly pbpa = vec2.create();
  protected readonly ra = vec2.create();
  protected readonly rb = vec2.create();
  protected readonly jacobian = new Float32Array(6);
  protected readonly velocities = new Float32Array(6);

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly jointA: vec2,
    public readonly bodyB: Body,
    public readonly jointB: vec2,
    public readonly distance: number
  ) {
    super();
  }

  getJacobian(out: Float32Array): void {
    out.fill(0.0);

    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    vec2.sub(this.pbpa, this.pb, this.pa);

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

  getClamping() {
    return { min: -1.0e5, max: 1.0e5 };
  }

  getDotJacobian(out: Float32Array): void {
    out.fill(0.0);

    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);
    vec2.sub(this.pbpa, this.pb, this.pa);

    vec2.sub(this.ra, this.pa, this.bodyA.position);
    vec2.sub(this.rb, this.pb, this.bodyB.position);

    out[0] = -(
      this.bodyB.velocity[0] -
      this.bodyB.omega * this.rb[1] -
      this.bodyA.velocity[0] +
      this.bodyA.omega * this.ra[1]
    );

    out[1] = -(
      this.bodyB.velocity[1] +
      this.bodyB.omega * this.rb[0] -
      this.bodyA.velocity[1] -
      this.bodyA.omega * this.ra[0]
    );

    out[2] =
      -cross(
        vec2.fromValues(
          -this.bodyA.omega * this.ra[1],
          this.bodyA.omega * this.ra[0]
        ),
        this.pbpa
      ) - cross(this.ra, vec2.fromValues(-out[0], -out[1]));

    out[3] = -out[0];
    out[4] = -out[1];
    out[5] =
      cross(
        vec2.fromValues(
          -this.bodyB.omega * this.rb[1],
          this.bodyB.omega * this.rb[0]
        ),
        this.pbpa
      ) + cross(this.rb, vec2.fromValues(-out[0], -out[1]));
  }

  getValue(): number {
    vec2.transformMat3(this.pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(this.pb, this.jointB, this.bodyB.transform);

    return 0.5 * (vec2.squaredDistance(this.pa, this.pb) - this.distance ** 2);
  }

  getSpeed(): number {
    this.getJacobian(this.jacobian);
    this.velocities.fill(0);
    this.velocities[0] = this.bodyA.velocity[0];
    this.velocities[1] = this.bodyA.velocity[1];
    this.velocities[2] = this.bodyA.omega;
    this.velocities[3] = this.bodyB.velocity[0];
    this.velocities[4] = this.bodyB.velocity[1];
    this.velocities[5] = this.bodyB.omega;
    return VxV(this.velocities, this.jacobian);
  }
}

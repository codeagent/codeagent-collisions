import { vec2, vec3 } from 'gl-matrix';

import { Vector, VxV } from './solver';
import { World } from './world';

export interface ConstraintClamping {
  min: number;
  max: number;
}

export interface ConstraintInterface {
  getJacobian(): Vector;
  getPushFactor(dt: number, strength: number): number;
  getClamping(): ConstraintClamping;
}

export class DistanceConstraint implements ConstraintInterface {
  constructor(
    public world: World,
    public bodyAIndex: number,
    public jointA: vec2,
    public bodyBIndex: number,
    public jointB: vec2,
    public distance: number
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    const ra = vec2.create();
    vec2.sub(ra, pa, bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, pb, bodyB.position);

    const pbpa = vec2.create();
    vec2.sub(pbpa, pb, pa);

    const x = vec3.create();

    J[this.bodyAIndex * 3] = -pbpa[0] * 2.0;
    J[this.bodyAIndex * 3 + 1] = -pbpa[1] * 2.0;
    J[this.bodyAIndex * 3 + 2] = -vec2.cross(x, ra, pbpa)[2] * 2.0;

    J[this.bodyBIndex * 3] = pbpa[0] * 2.0;
    J[this.bodyBIndex * 3 + 1] = pbpa[1] * 2.0;
    J[this.bodyBIndex * 3 + 2] = vec2.cross(x, rb, pbpa)[2] * 2.0;

    return J;
  }

  getPushFactor(dt: number, strength = 1.0): number {
    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, bodyB.transform);

    return ((this.distance - vec2.distance(pb, pa)) * strength * 2.0) / dt;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

export class ContactConstraint implements ConstraintInterface {
  constructor(
    public world: World,
    public bodyAIndex: number,
    public bodyBIndex: number,
    public joint: vec2,
    public normal: vec2, // normal at bodyA
    public penetration: number
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const ra = vec2.create();
    vec2.sub(ra, this.joint, bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, this.joint, bodyB.position);

    const x = vec3.create();

    J[this.bodyAIndex * 3] = -this.normal[0];
    J[this.bodyAIndex * 3 + 1] = -this.normal[1];
    J[this.bodyAIndex * 3 + 2] = -vec2.cross(x, ra, this.normal)[2];

    J[this.bodyBIndex * 3] = this.normal[0];
    J[this.bodyBIndex * 3 + 1] = this.normal[1];
    J[this.bodyBIndex * 3 + 2] = vec2.cross(x, rb, this.normal)[2];

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    return strength
      ? (this.penetration / dt) * strength
      : -VxV(this.getJacobian(), this.world.velocities) *
          this.world.restitution;
  }

  getClamping() {
    return { min: 0.0, max: Number.POSITIVE_INFINITY };
  }
}

export class FrictionConstraint {
  constructor(
    public world: World,
    public bodyAIndex: number,
    public bodyBIndex: number,
    public joint: vec2,
    public normal: vec2, // normal at bodyA
    public mu: number
  ) {}

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    const ra = vec2.create();
    vec2.sub(ra, this.joint, bodyA.position);

    const rb = vec2.create();
    vec2.sub(rb, this.joint, bodyB.position);

    const x = vec3.create();
    const normal = vec2.fromValues(-this.normal[1], this.normal[0]);

    J[this.bodyAIndex * 3] = -normal[0];
    J[this.bodyAIndex * 3 + 1] = -normal[1];
    J[this.bodyAIndex * 3 + 2] = -vec2.cross(x, ra, normal)[2];

    J[this.bodyBIndex * 3] = normal[0];
    J[this.bodyBIndex * 3 + 1] = normal[1];
    J[this.bodyBIndex * 3 + 2] = vec2.cross(x, rb, normal)[2];

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    const m1 = this.world.bodies[this.bodyAIndex].mass;
    const m2 = this.world.bodies[this.bodyBIndex].mass;

    const combined =
      Number.isFinite(m1) && Number.isFinite(m2)
        ? 0.5 * (m1 + m2)
        : Number.isFinite(m1)
        ? m1
        : Number.isFinite(m2)
        ? m2
        : 0.0;

    const c1 = Math.abs(
      this.mu * combined * vec2.dot(this.world.gravity, this.normal)
    );

    return { min: -c1, max: c1 };
  }
}

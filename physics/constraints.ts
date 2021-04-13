import { vec2 } from "gl-matrix";
import { Vector } from "./solver";
import { cross } from "./tests";
import { World } from "./world";

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

    J[this.bodyAIndex * 3] = -pbpa[0] * 2.0;
    J[this.bodyAIndex * 3 + 1] = -pbpa[1] * 2.0;
    J[this.bodyAIndex * 3 + 2] = -cross(ra, pbpa) * 2.0;

    J[this.bodyBIndex * 3] = pbpa[0] * 2.0;
    J[this.bodyBIndex * 3 + 1] = pbpa[1] * 2.0;
    J[this.bodyBIndex * 3 + 2] = cross(rb, pbpa) * 2.0;

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
    public normal: vec2,  // normal at bodyA
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

    J[this.bodyAIndex * 3] = -this.normal[0];
    J[this.bodyAIndex * 3 + 1] = -this.normal[1];
    J[this.bodyAIndex * 3 + 2] = -cross(ra, this.normal);

    J[this.bodyBIndex * 3] = this.normal[0];
    J[this.bodyBIndex * 3 + 1] = this.normal[1];
    J[this.bodyBIndex * 3 + 2] = cross(rb, this.normal);

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    return (this.penetration / dt) * strength;
  }

  getClamping() {
    return { min: 0.0, max: Number.POSITIVE_INFINITY };
  }
}

export class FrictionConstraint {
  constructor() {}

  getJacobian(): Vector {
    return null;
  }

  getPushFactor(dt: number, strength: number): number {
    return null;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

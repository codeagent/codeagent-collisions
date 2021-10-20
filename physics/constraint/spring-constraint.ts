import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

const pa = vec2.create();
const ra = vec2.create();
const pb = vec2.create();
const rb = vec2.create();
const pbpa = vec2.create();
const x = vec3.create();
const n = vec2.create();

export class SpringConstraint extends ConstraintBase {
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

  getJacobian(values: number[], columns: number[]): number {
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);
    vec2.sub(pbpa, pb, pa);
    vec2.normalize(pbpa, pbpa);

    const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
    const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
    if (bodyAIndex < bodyBIndex) {
      return (
        this.writeA(values, columns, bodyAIndex * 3, pbpa) +
        this.writeB(values, columns, bodyBIndex * 3, pbpa)
      );
    } else {
      return (
        this.writeB(values, columns, bodyBIndex * 3, pbpa) +
        this.writeA(values, columns, bodyAIndex * 3, pbpa)
      );
    }
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);
    vec2.sub(ra, pa, this.bodyA.position);
    vec2.sub(rb, pb, this.bodyB.position);
    vec2.sub(n, pb, pa);

    const distance = vec2.length(n);
    vec2.scale(n, n, 1.0 / distance);

    const va = vec2.clone(this.bodyA.velocity);
    vec2.scaleAndAdd(va, va, vec2.fromValues(-ra[1], ra[0]), this.bodyA.omega);

    const vb = vec2.clone(this.bodyB.velocity);
    vec2.scaleAndAdd(vb, vb, vec2.fromValues(-rb[1], rb[0]), this.bodyB.omega);

    // Damping force
    const fd = this.extinction * (vec2.dot(n, va) - vec2.dot(n, vb));

    // Stiff force
    const fs = this.stiffness * (this.length - distance);

    const c = fs + fd;

    return { min: c, max: c };
  }

  private writeA(
    values: number[],
    columns: number[],
    offset: number,
    pbpa: vec2
  ): number {
    if (!this.bodyA.isStatic) {
      vec2.sub(ra, pa, this.bodyA.position);
      values.push(-pbpa[0], -pbpa[1], -vec2.cross(x, ra, pbpa)[2]);
      columns.push(offset, offset + 1, offset + 2);
      return 3;
    }
    return 0;
  }

  private writeB(
    values: number[],
    columns: number[],
    offset: number,
    pbpa: vec2
  ): number {
    if (!this.bodyB.isStatic) {
      vec2.sub(rb, pb, this.bodyB.position);
      values.push(pbpa[0], pbpa[1], vec2.cross(x, rb, pbpa)[2]);
      columns.push(offset, offset + 1, offset + 2);
      return 3;
    }
    return 0;
  }
}

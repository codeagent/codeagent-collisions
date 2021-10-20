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

export class DistanceConstraint extends ConstraintBase {
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

  getJacobian(values: number[], columns: number[]): number {
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);
    vec2.sub(pbpa, pb, pa);
    vec2.normalize(pbpa, pbpa);

    const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
    const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
    if (bodyAIndex < bodyBIndex) {
      return (
        this.writeA(values, columns, bodyAIndex * 3, pa, pbpa) +
        this.writeB(values, columns, bodyBIndex * 3, pb, pbpa)
      );
    } else {
      return (
        this.writeB(values, columns, bodyBIndex * 3, pb, pbpa) +
        this.writeA(values, columns, bodyAIndex * 3, pa, pbpa)
      );
    }
  }

  getPushFactor(dt: number, strength = 1.0): number {
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);
    return ((this.distance - vec2.distance(pb, pa)) * strength) / dt;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }

  private writeA(
    values: number[],
    columns: number[],
    offset: number,
    pa: vec2,
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
    pb: vec2,
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

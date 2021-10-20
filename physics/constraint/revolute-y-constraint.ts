import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

const pa = vec2.create();
const ra = vec2.create();
const pb = vec2.create();
const rb = vec2.create();

export class RevoluteYConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly jointA: vec2,
    public readonly bodyB: Body,
    public readonly jointB: vec2
  ) {
    super();
  }

  getJacobian(values: number[], columns: number[]): number {
    const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
    const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
    if (bodyAIndex < bodyBIndex) {
      return (
        this.writeA(values, columns, bodyAIndex * 3) +
        this.writeB(values, columns, bodyBIndex * 3)
      );
    } else {
      return (
        this.writeB(values, columns, bodyBIndex * 3) +
        this.writeA(values, columns, bodyAIndex * 3)
      );
    }
  }

  getPushFactor(dt: number, strength: number): number {
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);
    return -((pa[1] - pb[1]) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }

  private writeA(values: number[], columns: number[], offset: number): number {
    if (!this.bodyA.isStatic) {
      vec2.transformMat3(pa, this.jointA, this.bodyA.transform);
      vec2.sub(ra, pa, this.bodyA.position);
      values.push(1, ra[0]);
      columns.push(offset + 1, offset + 2);
      return 2;
    }
    return 0;
  }

  private writeB(values: number[], columns: number[], offset: number): number {
    if (!this.bodyB.isStatic) {
      vec2.transformMat3(pb, this.jointB, this.bodyB.transform);
      vec2.sub(rb, pb, this.bodyB.position);
      values.push(-1, -rb[0]);
      columns.push(offset + 1, offset + 2);
      return 2;
    }
    return 0;
  }
}

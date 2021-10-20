import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { transformMat3Vec } from '../collision/utils';
import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

const t = vec2.create();
const u = vec2.create();
const pa = vec2.create();
const ra = vec2.create();
const pb = vec2.create();
const rb = vec2.create();
const x = vec3.create();

export class LineConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly jointA: vec2,
    public readonly bodyB: Body,
    public readonly jointB: vec2,
    public readonly axisA: vec2
  ) {
    super();
  }

  getJacobian(values: number[], columns: number[]): number {
    transformMat3Vec(
      t,
      vec2.fromValues(-this.axisA[1], this.axisA[0]),
      this.bodyA.transform
    );
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
    const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
    if (bodyAIndex < bodyBIndex) {
      return (
        this.writeA(values, columns, bodyAIndex * 3, t, pb) +
        this.writeB(values, columns, bodyBIndex * 3, t, pb)
      );
    } else {
      return (
        this.writeB(values, columns, bodyBIndex * 3, t, pb) +
        this.writeA(values, columns, bodyAIndex * 3, t, pb)
      );
    }
  }

  getPushFactor(dt: number, strength: number): number {
    const t = vec2.create();
    transformMat3Vec(
      t,
      vec2.fromValues(-this.axisA[1], this.axisA[0]),
      this.bodyA.transform
    );

    const pa = vec2.create();
    vec2.transformMat3(pa, this.jointA, this.bodyA.transform);

    const pb = vec2.create();
    vec2.transformMat3(pb, this.jointB, this.bodyB.transform);

    const u = vec2.create();
    vec2.sub(u, pb, pa);

    return -(vec2.dot(t, u) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }

  private writeA(
    values: number[],
    columns: number[],
    offset: number,
    t: vec2,
    pb: vec2
  ): number {
    if (!this.bodyA.isStatic) {
      vec2.transformMat3(pa, this.jointA, this.bodyA.transform);
      vec2.sub(u, pb, pa);
      vec2.sub(ra, pa, this.bodyA.position);
      vec2.add(ra, ra, u);
      values.push(-t[0], -t[1], -vec2.cross(x, ra, t)[2]);
      columns.push(offset, offset + 1, offset + 2);
      return 3;
    }
    return 0;
  }

  private writeB(
    values: number[],
    columns: number[],
    offset: number,
    t: vec2,
    pb: vec2
  ): number {
    if (!this.bodyB.isStatic) {
      vec2.sub(rb, pb, this.bodyB.position);
      values.push(t[0], t[1], vec2.cross(x, rb, t)[2]);
      columns.push(offset, offset + 1, offset + 2);
      return 3;
    }
    return 0;
  }
}

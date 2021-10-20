import { vec2, vec3 } from 'gl-matrix';

import { Body } from '../body';
import { World } from '../world';
import { ConstraintBase } from './constraint.base';

export class FrictionConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly bodyB: Body,
    public readonly joint: vec2,
    public readonly normal: vec2, // normal at bodyA
    public readonly mu: number
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

  private writeA(values: number[], columns: number[], offset: number): number {
    if (!this.bodyA.isStatic) {
      const normal = vec2.fromValues(-this.normal[1], this.normal[0]);
      const ra = vec2.create();
      const x = vec3.create();
      vec2.sub(ra, this.joint, this.bodyA.position);
      values.push(-normal[0], -normal[1], -vec2.cross(x, ra, normal)[2]);
      columns.push(offset, offset + 1, offset + 2);
      return 3;
    }
    return 0;
  }

  private writeB(values: number[], columns: number[], offset: number): number {
    if (!this.bodyB.isStatic) {
      const normal = vec2.fromValues(-this.normal[1], this.normal[0]);
      const rb = vec2.create();
      const x = vec3.create();
      vec2.sub(rb, this.joint, this.bodyB.position);
      values.push(normal[0], normal[1], vec2.cross(x, rb, normal)[2]);
      columns.push(offset, offset + 1, offset  + 2);
      return 3;
    }
    return 0;
  }

  getPushFactor(dt: number, strength: number): number {
    return 0.0;
  }

  getClamping() {
    const m1 = this.bodyA.mass;
    const m2 = this.bodyB.mass;

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

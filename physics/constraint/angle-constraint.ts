import { World } from '../world';

import { ConstraintBase } from './constraint.base';
import { Body } from '../body';

export class AngleConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly bodyB: Body,
    public readonly angle: number
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
    if (isFinite(this.bodyA.inertia)) {
      values.push(-1);
      columns.push(offset + 2);
      return 1;
    }
    return 0;
  }

  private writeB(values: number[], columns: number[], offset: number): number {
    if (isFinite(this.bodyB.inertia)) {
      values.push(1);
      columns.push(offset + 2);
      return 1;
    }
    return 0;
  }

  getPushFactor(dt: number, strength: number): number {
    return (
      ((this.angle - (this.bodyB.angle - this.bodyA.angle)) / dt) * strength
    );
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

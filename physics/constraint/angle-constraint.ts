import { World } from '../world';
import { Vector } from '../solver';
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

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    if (isFinite(this.bodyA.inertia)) {
      const bodyAIndex = this.world.bodyIndex.get(this.bodyA);
      J[bodyAIndex * 3] = 0;
      J[bodyAIndex * 3 + 1] = 0;
      J[bodyAIndex * 3 + 2] = -1;
    }

    if (isFinite(this.bodyB.inertia)) {
      const bodyBIndex = this.world.bodyIndex.get(this.bodyB);
      J[bodyBIndex * 3] = 0;
      J[bodyBIndex * 3 + 1] = 0;
      J[bodyBIndex * 3 + 2] = 1;
    }

    return J;
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

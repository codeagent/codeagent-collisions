import { World } from '../world';
import { Vector } from '../solver';
import { ConstraintBase } from './constraint.base';

export class AngleConstraint extends ConstraintBase {
  constructor(
    public readonly world: World,
    public readonly bodyAIndex: number,
    public readonly bodyBIndex: number,
    public readonly angle: number
  ) {
    super();
  }

  getJacobian(): Vector {
    const J = new Float32Array(this.world.bodies.length * 3);

    J[this.bodyAIndex * 3] = 0;
    J[this.bodyAIndex * 3 + 1] = 0;
    J[this.bodyAIndex * 3 + 2] = -1;

    J[this.bodyBIndex * 3] = 0;
    J[this.bodyBIndex * 3 + 1] = 0;
    J[this.bodyBIndex * 3 + 2] = 1;

    return J;
  }

  getPushFactor(dt: number, strength: number): number {
    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];

    return ((this.angle - (bodyB.angle - bodyA.angle)) / dt) * strength;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }
}

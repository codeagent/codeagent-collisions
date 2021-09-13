import { World } from '../world';
import { AngleConstraint } from './angle-constraint';

export class MaxAngleConstraint extends AngleConstraint {
  constructor(
    world: World,
    bodyAIndex: number,
    bodyBIndex: number,
    angle: number
  ) {
    super(world, bodyAIndex, bodyBIndex, angle);
  }

  getPushFactor(dt: number, strength: number): number {
    const bodyA = this.world.bodies[this.bodyAIndex];
    const bodyB = this.world.bodies[this.bodyBIndex];
    const violation = this.angle - (bodyB.angle - bodyA.angle);
    // violation < 0 means constraint is broken
    return violation > 0 ? violation / dt : (strength * violation) / dt;
  }

  getClamping() {
    return { min: Number.NEGATIVE_INFINITY, max: 0 };
  }
}

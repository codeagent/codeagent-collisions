import { AngleConstraint } from './angle-constraint';
import { WorldInterface } from '../world.interface';
import { BodyInterface } from '../body.interface';

export class MinAngleConstraint extends AngleConstraint {
  constructor(
    world: WorldInterface,
    bodyA: BodyInterface,
    bodyB: BodyInterface,
    angle: number
  ) {
    super(world, bodyA, bodyB, angle);
  }

  getPushFactor(dt: number, strength: number): number {
    const violation = this.angle - (this.bodyB.angle - this.bodyA.angle);
    // violation > 0 means constraint is broken
    return violation < 0 ? violation / dt : 0;
  }

  getClamping() {
    return { min: 0, max: Number.POSITIVE_INFINITY };
  }
}

import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import { DistanceConstraint, ConstraintInterface } from '../constraint';
import { Body } from '../body';

export class DistanceJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly pivotA: vec2,
    public readonly bodyB: Body,
    public readonly pivotB: vec2,
    public readonly distance: number
  ) {
    this.constraints.push(
      new DistanceConstraint(
        world,
        bodyA,
        vec2.clone(pivotA),
        bodyB,
        vec2.clone(pivotB),
        distance
      )
    );
  }

  *[Symbol.iterator]() {
    yield this.constraints[0];
  }

  getConstraints() {
    return this.constraints;
  }
}

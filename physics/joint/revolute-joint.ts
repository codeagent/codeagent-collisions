import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import {
  ConstraintInterface,
  RevoluteXConstraint,
  RevoluteYConstraint,
} from '../constraint';

import { Body } from '../body';

export class RevoluteJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly pivotA: vec2,
    public readonly bodyB: Body,
    public readonly pivotB: vec2
  ) {
    this.constraints.push(
      new RevoluteXConstraint(
        world,
        bodyA,
        vec2.clone(pivotA),
        bodyB,
        vec2.clone(pivotB)
      )
    );

    this.constraints.push(
      new RevoluteYConstraint(
        world,
        bodyA,
        vec2.clone(pivotA),
        bodyB,
        vec2.clone(pivotB)
      )
    );
  }
  *[Symbol.iterator]() {
    yield this.constraints[0];
    yield this.constraints[1];
  }

  getConstraints() {
    return this.constraints;
  }
}

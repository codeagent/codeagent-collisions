import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import { ConstraintInterface, SpringConstraint } from '../constraint';
import { Body } from '../body';
import { MouseControlInterface } from '../mouse-control';

export class MouseJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  constructor(
    public readonly control: MouseControlInterface,
    public readonly distance: number,
    public readonly stiffness: number,
    public readonly extinction: number
  ) {
    this.constraints.push(
      new SpringConstraint(
        world,
        bodyA,
        vec2.clone(pivotA),
        bodyB,
        vec2.clone(pivotB),
        distance,
        stiffness,
        extinction
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

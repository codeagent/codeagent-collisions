import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import {
  ConstraintInterface,
  MaxAngleConstraint,
  MinAngleConstraint,
  RevoluteXConstraint,
  RevoluteYConstraint,
} from '../constraint';

import { Body } from '../body';

export class WeldJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly pivotA: vec2,
    public readonly bodyB: Body,
    public readonly pivotB: vec2,
    public readonly refAngle: number
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

    this.constraints.push(
      new MinAngleConstraint(
        world,
        bodyA,
        bodyB,
        refAngle ? refAngle : bodyB.angle - bodyA.angle
      )
    );

    this.constraints.push(
      new MaxAngleConstraint(
        world,
        bodyA,
        bodyB,
        refAngle ? refAngle : bodyB.angle - bodyA.angle
      )
    );
  }

  *[Symbol.iterator]() {
    yield this.constraints[0];
    yield this.constraints[1];
    yield this.constraints[2];
    yield this.constraints[3];
  }

  getConstraints() {
    return this.constraints;
  }
}

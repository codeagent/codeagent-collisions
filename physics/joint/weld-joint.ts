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

  get size() {
    return 4;
  }

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
        world.bodies.indexOf(bodyA),
        vec2.clone(pivotA),
        world.bodies.indexOf(bodyB),
        vec2.clone(pivotB)
      )
    );

    this.constraints.push(
      new RevoluteYConstraint(
        world,
        world.bodies.indexOf(bodyA),
        vec2.clone(pivotA),
        world.bodies.indexOf(bodyB),
        vec2.clone(pivotB)
      )
    );

    this.constraints.push(
      new MinAngleConstraint(
        world,
        world.bodies.indexOf(bodyA),
        world.bodies.indexOf(bodyB),
        refAngle ? refAngle : bodyB.angle - bodyA.angle
      )
    );

    this.constraints.push(
      new MaxAngleConstraint(
        world,
        world.bodies.indexOf(bodyA),
        world.bodies.indexOf(bodyB),
        refAngle ? refAngle : bodyB.angle - bodyA.angle
      )
    );
  }

  getConstraints() {
    return this.constraints;
  }
}

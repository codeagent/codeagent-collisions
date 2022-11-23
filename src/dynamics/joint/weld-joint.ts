import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import {
  MaxAngleConstraint,
  MinAngleConstraint,
  RevoluteXConstraint,
  RevoluteYConstraint,
} from '../constraint';

import { Body } from '../body';

export class WeldJoint implements JointInterface {
  private readonly revoluteXConstraint: RevoluteXConstraint;
  private readonly revoluteYConstraint: RevoluteYConstraint;
  private readonly minAngleConstraint: MinAngleConstraint;
  private readonly maxAngleConstraint: MaxAngleConstraint;

  get length(): number {
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
    this.revoluteXConstraint = new RevoluteXConstraint(
      world,
      bodyA,
      vec2.clone(pivotA),
      bodyB,
      vec2.clone(pivotB)
    );

    this.revoluteYConstraint = new RevoluteYConstraint(
      world,
      bodyA,
      vec2.clone(pivotA),
      bodyB,
      vec2.clone(pivotB)
    );

    this.minAngleConstraint = new MinAngleConstraint(
      world,
      bodyA,
      bodyB,
      refAngle ? refAngle : bodyB.angle - bodyA.angle
    );

    this.maxAngleConstraint = new MaxAngleConstraint(
      world,
      bodyA,
      bodyB,
      refAngle ? refAngle : bodyB.angle - bodyA.angle
    );
  }

  *[Symbol.iterator]() {
    yield this.revoluteXConstraint;
    yield this.revoluteYConstraint;
    yield this.minAngleConstraint;
    yield this.maxAngleConstraint;
  }
}

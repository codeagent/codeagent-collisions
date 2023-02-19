import { vec2 } from 'gl-matrix';

import {
  AngleConstraint,
  RevoluteXConstraint,
  RevoluteYConstraint,
} from '../constraint';
import {
  BodyInterface,
  WorldInterface,
  JointInterface,
  ConstraintInterface,
} from '../types';

export interface WeldJointDef {
  bodyA: Readonly<BodyInterface>;
  pivotA?: Readonly<vec2>;
  bodyB: Readonly<BodyInterface>;
  pivotB?: Readonly<vec2>;
  refAngle?: number;
}

export class WeldJoint implements JointInterface {
  private readonly revoluteXConstraint: RevoluteXConstraint;

  private readonly revoluteYConstraint: RevoluteYConstraint;

  private readonly angleConstraint: AngleConstraint;

  constructor(
    readonly world: WorldInterface,
    readonly bodyA: Readonly<BodyInterface>,
    readonly pivotA: Readonly<vec2>,
    readonly bodyB: Readonly<BodyInterface>,
    readonly pivotB: Readonly<vec2>,
    readonly refAngle: number
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

    this.angleConstraint = new AngleConstraint(
      world,
      bodyA,
      bodyB,
      refAngle ? refAngle : bodyB.angle - bodyA.angle
    );
  }

  *[Symbol.iterator](): Iterator<ConstraintInterface> {
    yield this.revoluteXConstraint;
    yield this.revoluteYConstraint;
    yield this.angleConstraint;
  }
}

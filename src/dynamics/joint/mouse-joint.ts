import { vec2 } from 'gl-matrix';

import { MouseXConstraint, MouseYConstraint } from '../constraint';
import {
  BodyInterface,
  WorldInterface,
  JointInterface,
  ConstraintInterface,
  MouseControlInterface,
} from '../types';

export interface MouseJointDef {
  control: MouseControlInterface;
  body: Readonly<BodyInterface>;
  joint: Readonly<vec2>;
  stiffness?: number;
  maxForce?: number;
}

export class MouseJoint implements JointInterface {
  readonly bodyB: BodyInterface = null;

  private mouseXConstraint: ConstraintInterface;

  private mouseYConstraint: ConstraintInterface;

  constructor(
    readonly world: WorldInterface,
    readonly control: MouseControlInterface,
    readonly bodyA: Readonly<BodyInterface>,
    readonly joint: Readonly<vec2>,
    readonly stiffness: number,
    readonly maxForce: number
  ) {
    this.mouseXConstraint = new MouseXConstraint(
      world,
      bodyA,
      joint,
      control,
      stiffness,
      maxForce
    );

    this.mouseYConstraint = new MouseYConstraint(
      world,
      bodyA,
      joint,
      control,
      stiffness,
      maxForce
    );
  }

  *[Symbol.iterator](): Iterator<ConstraintInterface> {
    yield this.mouseXConstraint;
    yield this.mouseYConstraint;
  }
}

import { vec2 } from 'gl-matrix';

import { BodyInterface } from '../body.interface';
import {
  ConstraintInterface,
  MouseXConstraint,
  MouseYConstraint,
} from '../constraint';
import { WorldInterface } from '../world.interface';

import { JointInterface } from './joint.interface';

export interface MouseControlInterface {
  getCursorPosition(out: vec2): Readonly<vec2>;
}

export interface MouseJointDef {
  control: MouseControlInterface;
  body: Readonly<BodyInterface>;
  joint: Readonly<vec2>;
  stiffness?: number;
  maxForce?: number;
}

export class MouseJoint implements JointInterface {
  public readonly bodyB: BodyInterface = null;

  private mouseXConstraint: ConstraintInterface;

  private mouseYConstraint: ConstraintInterface;

  constructor(
    readonly world: WorldInterface,
    public readonly control: MouseControlInterface,
    public readonly bodyA: Readonly<BodyInterface>,
    public readonly joint: Readonly<vec2>,
    public readonly stiffness: number,
    public readonly maxForce: number
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

  *[Symbol.iterator]() {
    yield this.mouseXConstraint;
    yield this.mouseYConstraint;
  }
}

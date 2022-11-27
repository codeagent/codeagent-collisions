import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import { MouseXConstraint, MouseYConstraint } from '../constraint';
import { Body } from '../body';

export interface MouseControlInterface {
  getCursorPosition(): vec2;
}

export class MouseJoint implements JointInterface {
  public readonly bodyB: Body = null;

  private mouseXConstraint: MouseXConstraint;
  private mouseYConstraint: MouseYConstraint;

  constructor(
    public readonly world: World,
    public readonly control: MouseControlInterface,
    public readonly bodyA: Body,
    public readonly joint: vec2,
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

import { AngularMotorConstraint } from '../constraint';
import {
  BodyInterface,
  WorldInterface,
  ConstraintInterface,
  JointInterface,
} from '../types';

export interface MotorDef {
  body: Readonly<BodyInterface>;
  speed?: number;
  torque?: number;
}

export class MotorJoint implements JointInterface {
  readonly bodyB: Readonly<BodyInterface> = null;

  private readonly motorConstraint: ConstraintInterface;

  constructor(
    readonly world: WorldInterface,
    readonly bodyA: Readonly<BodyInterface>,
    readonly speed: number,
    readonly torque: number
  ) {
    this.motorConstraint = new AngularMotorConstraint(
      world,
      bodyA,
      speed,
      torque
    );
  }

  *[Symbol.iterator](): Iterator<ConstraintInterface> {
    yield this.motorConstraint;
  }
}

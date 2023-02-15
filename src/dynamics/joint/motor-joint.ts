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
  public readonly bodyB: Readonly<BodyInterface> = null;

  private readonly motorConstraint: ConstraintInterface;

  constructor(
    readonly world: WorldInterface,
    public readonly bodyA: Readonly<BodyInterface>,
    public readonly speed: number,
    public readonly torque: number
  ) {
    this.motorConstraint = new AngularMotorConstraint(
      world,
      bodyA,
      speed,
      torque
    );
  }

  *[Symbol.iterator]() {
    yield this.motorConstraint;
  }
}

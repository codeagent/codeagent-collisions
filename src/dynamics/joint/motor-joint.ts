import { World } from '../world';
import { JointInterface } from './joint.interface';
import { AngularMotorConstraint } from '../constraint';
import { Body } from '../body';

export class MotorJoint implements JointInterface {
  public readonly bodyB: Body = null;

  private readonly motorConstraint: AngularMotorConstraint;

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
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

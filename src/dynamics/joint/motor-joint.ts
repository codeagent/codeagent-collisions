import { JointInterface } from './joint.interface';
import { AngularMotorConstraint, ConstraintInterface } from '../constraint';
import { BodyInterface } from '../body.interface';
import { WorldInterface } from '../world.interface';

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

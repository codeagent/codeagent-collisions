import { vec2 } from 'gl-matrix';

import { JointInterface } from './joint.interface';
import {
  AngleConstraint,
  MinAngleConstraint,
  RevoluteXConstraint,
  RevoluteYConstraint,
} from '../constraint';

import { BodyInterface } from '../body.interface';
import { WorldInterface } from '../world.interface';

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
  private readonly angleConstraint: MinAngleConstraint;

  constructor(
    readonly world: WorldInterface,
    public readonly bodyA: Readonly<BodyInterface>,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: Readonly<BodyInterface>,
    public readonly pivotB: Readonly<vec2>,
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

    this.angleConstraint = new AngleConstraint(
      world,
      bodyA,
      bodyB,
      refAngle ? refAngle : bodyB.angle - bodyA.angle
    );
  }

  *[Symbol.iterator]() {
    yield this.revoluteXConstraint;
    yield this.revoluteYConstraint;
    yield this.angleConstraint;
  }
}

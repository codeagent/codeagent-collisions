import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import { ConstraintInterface, DistanceConstraint } from '../constraint';
import { BodyInterface } from '../body.interface';
import { Body } from '../body';

export interface DistanceJointDef {
  bodyA: Readonly<BodyInterface>;
  jointA: Readonly<vec2>;
  bodyB: Readonly<BodyInterface>;
  jointB: Readonly<vec2>;
  distance: number;
}

export class DistanceJoint implements JointInterface {
  private readonly distanceConstraint: ConstraintInterface;

  constructor(
    readonly world: World,
    public readonly bodyA: Readonly<BodyInterface>,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: Readonly<BodyInterface>,
    public readonly pivotB: Readonly<vec2>,
    public readonly distance: number
  ) {
    this.distanceConstraint = new DistanceConstraint(
      world,
      bodyA,
      vec2.clone(pivotA),
      bodyB,
      vec2.clone(pivotB),
      distance
    );
  }

  *[Symbol.iterator]() {
    yield this.distanceConstraint;
  }
}

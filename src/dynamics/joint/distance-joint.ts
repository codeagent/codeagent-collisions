import { vec2 } from 'gl-matrix';

import { DistanceConstraint } from '../constraint';
import {
  WorldInterface,
  BodyInterface,
  JointInterface,
  ConstraintInterface,
} from '../types';

export interface DistanceJointDef {
  bodyA: Readonly<BodyInterface>;
  pivotA?: Readonly<vec2>;
  bodyB: Readonly<BodyInterface>;
  pivotB?: Readonly<vec2>;
  distance: number;
}

export class DistanceJoint implements JointInterface {
  private readonly distanceConstraint: ConstraintInterface;

  constructor(
    readonly world: WorldInterface,
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

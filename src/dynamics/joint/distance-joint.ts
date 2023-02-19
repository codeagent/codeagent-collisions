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
    readonly bodyA: Readonly<BodyInterface>,
    readonly pivotA: Readonly<vec2>,
    readonly bodyB: Readonly<BodyInterface>,
    readonly pivotB: Readonly<vec2>,
    readonly distance: number
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

  *[Symbol.iterator](): Iterator<ConstraintInterface> {
    yield this.distanceConstraint;
  }
}

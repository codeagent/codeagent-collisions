import { vec2 } from 'gl-matrix';

import {
  AngleConstraint,
  LineConstraint,
  MaxDistanceConstraint,
  MinDistanceConstraint,
} from '../constraint';
import {
  BodyInterface,
  WorldInterface,
  JointInterface,
  ConstraintInterface,
} from '../types';

export interface PrismaticJointDef {
  bodyA: Readonly<BodyInterface>;
  pivotA?: Readonly<vec2>;
  bodyB: Readonly<BodyInterface>;
  pivotB?: Readonly<vec2>;
  localAxis?: Readonly<vec2>;
  refAngle?: number;
  minDistance?: number;
  maxDistance?: number;
}

export class PrismaticJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  constructor(
    readonly world: WorldInterface,
    readonly bodyA: Readonly<BodyInterface>,
    readonly pivotA: Readonly<vec2>,
    readonly bodyB: Readonly<BodyInterface>,
    readonly pivotB: Readonly<vec2>,
    readonly localAxis: Readonly<vec2>,
    readonly refAngle: number,
    readonly minDistance: number,
    readonly maxDistance: number
  ) {
    this.constraints.push(
      new LineConstraint(
        world,
        bodyA,
        vec2.clone(pivotA),
        bodyB,
        vec2.clone(pivotB),
        vec2.clone(localAxis)
      ),
      new AngleConstraint(world, bodyA, bodyB, refAngle)
    );

    if (minDistance) {
      this.constraints.push(
        new MinDistanceConstraint(
          world,
          bodyA,
          vec2.clone(pivotA),
          bodyB,
          vec2.clone(pivotB),
          minDistance
        )
      );
    }

    if (isFinite(maxDistance)) {
      this.constraints.push(
        new MaxDistanceConstraint(
          world,
          bodyA,
          vec2.clone(pivotA),
          bodyB,
          vec2.clone(pivotB),
          maxDistance
        )
      );
    }
  }

  *[Symbol.iterator](): Iterator<ConstraintInterface> {
    yield* this.constraints;
  }
}

import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import {
  AngleConstraint,
  ConstraintInterface,
  LineConstraint,
  MaxDistanceConstraint,
  MinDistanceConstraint,
} from '../constraint';

import { Body } from '../body';

export class PrismaticJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  get length(): number {
    return this.constraints.length;
  }

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly pivotA: vec2,
    public readonly bodyB: Body,
    public readonly pivotB: vec2,
    public readonly localAxis: vec2,
    public readonly refAngle: number,
    public readonly minDistance: number,
    public readonly maxDistance: number
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

  *[Symbol.iterator]() {
    for (let i = 0, length = this.constraints.length; i < length; i++) {
      yield this.constraints[i];
    }
  }
}

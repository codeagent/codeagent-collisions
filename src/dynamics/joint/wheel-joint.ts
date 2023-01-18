import { vec2 } from 'gl-matrix';

import { BodyInterface } from '../body.interface';
import {
  ConstraintInterface,
  LineConstraint,
  MaxDistanceConstraint,
  MinDistanceConstraint,
} from '../constraint';
import { WorldInterface } from '../world.interface';

import { JointInterface } from './joint.interface';

export interface WheelJointDef {
  bodyA: Readonly<BodyInterface>;
  pivotA?: Readonly<vec2>;
  bodyB: Readonly<BodyInterface>;
  pivotB?: Readonly<vec2>;
  localAxis?: Readonly<vec2>;
  minDistance?: number;
  maxDistance?: number;
}

export class WheelJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  constructor(
    readonly world: WorldInterface,
    public readonly bodyA: Readonly<BodyInterface>,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: Readonly<BodyInterface>,
    public readonly pivotB: Readonly<vec2>,
    public readonly localAxis: Readonly<vec2>,
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
      )
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
    yield* this.constraints;
  }
}

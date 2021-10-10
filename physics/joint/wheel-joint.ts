import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import {
  ConstraintInterface,
  LineConstraint,
  MaxDistanceConstraint,
  MinDistanceConstraint,
} from '../constraint';
import { Body } from '../body';

export class WheelJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  get size() {
    return this.constraints.length;
  }

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly pivotA: vec2,
    public readonly bodyB: Body,
    public readonly pivotB: vec2,
    public readonly localAxis: vec2,
    public readonly minDistance: number,
    public readonly maxDistance: number
  ) {
    this.constraints.push(
      new LineConstraint(
        world,
        world.bodies.indexOf(bodyA),
        vec2.clone(pivotA),
        world.bodies.indexOf(bodyB),
        vec2.clone(pivotB),
        vec2.clone(localAxis)
      )
    );

    if (minDistance) {
      this.constraints.push(
        new MinDistanceConstraint(
          world,
          world.bodies.indexOf(bodyA),
          vec2.clone(pivotA),
          world.bodies.indexOf(bodyB),
          vec2.clone(pivotB),
          minDistance
        )
      );
    }

    if (isFinite(maxDistance)) {
      this.constraints.push(
        new MaxDistanceConstraint(
          world,
          world.bodies.indexOf(bodyA),
          vec2.clone(pivotA),
          world.bodies.indexOf(bodyB),
          vec2.clone(pivotB),
          maxDistance
        )
      );
    }
  }

  getConstraints() {
    return this.constraints;
  }
}

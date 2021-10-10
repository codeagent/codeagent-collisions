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
    public readonly refAngle: number,
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

    this.constraints.push(
      new AngleConstraint(
        world,
        world.bodies.indexOf(bodyA),
        world.bodies.indexOf(bodyB),
        refAngle
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

import { vec2, vec3 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import { ConstraintInterface } from '../constraint/constraint.interface';
import { DistanceConstraint } from '../constraint';
import { Body } from '../body';

export class DistanceJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly pivotA: vec2,
    public readonly bodyB: Body,
    public readonly pivotB: vec2,
    public readonly distance: number
  ) {
    this.constraints.push(
      new DistanceConstraint(
        world,
        world.bodies.indexOf(bodyA),
        vec2.clone(pivotA),
        world.bodies.indexOf(bodyB),
        vec2.clone(pivotB),
        distance
      )
    );
  }

  getConstraints() {
    return this.constraints;
  }
}

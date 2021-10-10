import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import { ConstraintInterface, SpringConstraint } from '../constraint';
import { Body } from '../body';

export class SpringJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  get size() {
    return 1;
  }

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly pivotA: vec2,
    public readonly bodyB: Body,
    public readonly pivotB: vec2,
    public readonly distance: number,
    public readonly stiffness: number,
    public readonly extinction: number
  ) {
    this.constraints.push(
      new SpringConstraint(
        world,
        world.bodies.indexOf(bodyA),
        vec2.clone(pivotA),
        world.bodies.indexOf(bodyB),
        vec2.clone(pivotB),
        distance,
        stiffness,
        extinction
      )
    );
  }

  getConstraints() {
    return this.constraints;
  }
}

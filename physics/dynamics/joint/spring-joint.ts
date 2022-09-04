import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import { SpringConstraint } from '../constraint';
import { Body } from '../body';

export class SpringJoint implements JointInterface {
  get length(): number {
    return 1;
  }

  private readonly springConstraint: SpringConstraint;

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
    this.springConstraint = new SpringConstraint(
      world,
      bodyA,
      vec2.clone(pivotA),
      bodyB,
      vec2.clone(pivotB),
      distance,
      stiffness,
      extinction
    );
  }

  *[Symbol.iterator]() {
    yield this.springConstraint;
  }
}

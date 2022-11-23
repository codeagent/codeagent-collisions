import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import { RevoluteXConstraint, RevoluteYConstraint } from '../constraint';

import { Body } from '../body';

export class RevoluteJoint implements JointInterface {
  get length(): number {
    return 2;
  }

  private readonly revoluteXConstraint: RevoluteXConstraint;
  private readonly revoluteYConstraint: RevoluteYConstraint;

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly pivotA: vec2,
    public readonly bodyB: Body,
    public readonly pivotB: vec2
  ) {
    this.revoluteXConstraint = new RevoluteXConstraint(
      world,
      bodyA,
      vec2.clone(pivotA),
      bodyB,
      vec2.clone(pivotB)
    );

    this.revoluteYConstraint = new RevoluteYConstraint(
      world,
      bodyA,
      vec2.clone(pivotA),
      bodyB,
      vec2.clone(pivotB)
    );
  }
  *[Symbol.iterator]() {
    yield this.revoluteXConstraint;
    yield this.revoluteYConstraint;
  }
}

import { vec2 } from 'gl-matrix';

import { SpringConstraint } from '../constraint';
import {
  BodyInterface,
  WorldInterface,
  JointInterface,
  ConstraintInterface,
} from '../types';

export interface SpringDef {
  bodyA: Readonly<BodyInterface>;
  pivotA?: Readonly<vec2>;
  bodyB: Readonly<BodyInterface>;
  pivotB?: Readonly<vec2>;
  distance: number;
  stiffness?: number;
  extinction?: number;
}

export class SpringJoint implements JointInterface {
  private readonly springConstraint: SpringConstraint;

  constructor(
    readonly world: WorldInterface,
    readonly bodyA: Readonly<BodyInterface>,
    readonly pivotA: Readonly<vec2>,
    readonly bodyB: Readonly<BodyInterface>,
    readonly pivotB: Readonly<vec2>,
    readonly distance: number,
    readonly stiffness: number,
    readonly extinction: number
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

  *[Symbol.iterator](): Iterator<ConstraintInterface> {
    yield this.springConstraint;
  }
}

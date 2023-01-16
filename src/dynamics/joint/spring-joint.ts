import { vec2 } from 'gl-matrix';

import { JointInterface } from './joint.interface';
import { SpringConstraint } from '../constraint';
import { BodyInterface } from '../body.interface';
import { WorldInterface } from '../world.interface';

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
    public readonly bodyA: Readonly<BodyInterface>,
    public readonly pivotA: Readonly<vec2>,
    public readonly bodyB: Readonly<BodyInterface>,
    public readonly pivotB: Readonly<vec2>,
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

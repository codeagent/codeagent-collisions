import { vec2 } from 'gl-matrix';

import { World } from '../world';
import { JointInterface } from './joint.interface';
import {
  ConstraintInterface,
  ContactConstraint,
  FrictionConstraint,
} from '../constraint';
import { Body } from '../body';

export class ContactJoint implements JointInterface {
  private readonly constraints: ConstraintInterface[] = [];

  constructor(
    public readonly world: World,
    public readonly bodyA: Body,
    public readonly bodyB: Body,
    public readonly concact: vec2,
    public readonly normal: vec2, // normal at bodyA
    public readonly penetration: number,
    public readonly friction: number
  ) {
    this.constraints.push(
      new ContactConstraint(
        world,
        bodyA,
        bodyB,
        vec2.clone(concact),
        vec2.clone(normal),
        penetration
      )
    );

    // if (friction) {
    //   this.constraints.push(
    //     new FrictionConstraint(
    //       world,
    //       bodyA,
    //       bodyB,
    //       vec2.clone(concact),
    //       vec2.clone(normal),
    //       friction
    //     )
    //   );
    // }
  }

  *[Symbol.iterator]() {
    for (let i = 0, length = this.constraints.length; i < length; i++) {
      yield this.constraints[i];
    }
  }

  getConstraints() {
    return this.constraints;
  }
}

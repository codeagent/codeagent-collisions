import { Body } from '../body';

import { ConstraintInterface } from '../constraint';

export interface JointInterface {
  readonly bodyA: Body;
  readonly bodyB: Body;
  readonly size: number;
  getConstraints(): Array<ConstraintInterface>;
}

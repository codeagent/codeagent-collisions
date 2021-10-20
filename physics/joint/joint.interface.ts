import { Body } from '../body';
import { ConstraintInterface } from '../constraint';

export interface JointInterface extends Iterable<ConstraintInterface> {
  readonly bodyA: Body;
  readonly bodyB: Body;
}

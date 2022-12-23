import { BodyInterface } from '../body.interface';
import { ConstraintInterface } from '../constraint';

export interface JointInterface extends Iterable<ConstraintInterface> {
  readonly bodyA: BodyInterface;
  readonly bodyB: BodyInterface;
}

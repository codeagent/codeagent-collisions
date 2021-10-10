import { ConstraintInterface } from '../constraint';

export interface JointInterface {
  getConstraints(): ArrayLike<ConstraintInterface>;
}

import { Body } from '../body';

import { ConstraintInterface } from './constraint.interface';

export interface ConstraintsSolverInterface {
  solve(
    outPositions: Float32Array,
    outVelocities: Float32Array,
    bodies: Readonly<Body>[],
    constraints: Readonly<ConstraintInterface>[],
    dt: number
  ): void;
}

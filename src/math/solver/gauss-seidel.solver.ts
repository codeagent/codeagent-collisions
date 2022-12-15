import { Inject, Service } from 'typedi';

import { Matrix, projectedGaussSeidel } from '../csr';
import { Settings } from '../../settings';

import { LinearEquationsSolverInterface } from './linear-equations-solver.interface';

@Service()
export class GaussSeidelSolver implements LinearEquationsSolverInterface {
  constructor(@Inject('SETTINGS') private readonly settings: Settings) {}

  solve(
    out: Float32Array,
    A: Readonly<Matrix>,
    b: Readonly<Float32Array>,
    min: Readonly<Float32Array>,
    max: Readonly<Float32Array>
  ): void {
    projectedGaussSeidel(out, A, b, min, max, this.settings.solverIterations);
  }
}

import { Matrix } from '../csr';

export interface LinearEquationsSolverInterface {
  solve(
    out: Float32Array,
    A: Readonly<Matrix>,
    b: Readonly<Float32Array>,
    min: Readonly<Float32Array>,
    max: Readonly<Float32Array>
  ): void;
}

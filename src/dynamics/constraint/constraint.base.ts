import { BodyInterface } from '../body.interface';

import {
  ConstraintInterface,
  ConstraintClamping,
} from './constraint.interface';

export abstract class ConstraintBase implements ConstraintInterface {
  readonly bodyA: Readonly<BodyInterface> = null;
  readonly bodyB: Readonly<BodyInterface> = null;

  private readonly cache: number[] = [0.0, 0.0];

  getCache(id: 0 | 1): number {
    return this.cache[id];
  }

  setCache(id: 0 | 1, value: number): void {
    this.cache[id] = value;
  }

  abstract getJacobian(out: Float32Array): void;
  abstract getPushFactor(dt: number, strength: number): number;
  abstract getClamping(): ConstraintClamping;
}

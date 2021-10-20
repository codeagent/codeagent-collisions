import {
  ConstraintInterface,
  ConstraintClamping,
} from './constraint.interface';

export abstract class ConstraintBase implements ConstraintInterface {
  private readonly cache = new Map<0 | 1, number>([
    [0, 0.0],
    [1, 0.0],
  ]);

  getCache(id: 0 | 1): number {
    return this.cache.get(id);
  }

  setCache(id: 0 | 1, value: number): void {
    this.cache.set(id, value);
  }

  abstract getJacobian(values: number[], columns: number[]): number;
  abstract getPushFactor(dt: number, strength: number): number;
  abstract getClamping(): ConstraintClamping;
}

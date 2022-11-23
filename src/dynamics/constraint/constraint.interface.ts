import { Body } from '../body';

export interface ConstraintClamping {
  min: number;
  max: number;
}

export interface ConstraintInterface {
  readonly bodyA: Body | null;
  readonly bodyB: Body | null;
  getJacobian(out: Float32Array, offset: number, length: number): void;
  getPushFactor(dt: number, strength: number): number;
  getClamping(): ConstraintClamping;
  getCache(id: 0 | 1): number;
  setCache(id: 0 | 1, value: number): void;
}

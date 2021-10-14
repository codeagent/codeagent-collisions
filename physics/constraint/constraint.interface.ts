import { Vector } from '../solver';

export interface ConstraintClamping {
  min: number;
  max: number;
}

export interface ConstraintInterface {
  getJacobian(): Vector;
  getPushFactor(dt: number, strength: number): number;
  getClamping(): ConstraintClamping;
  getCache(id: 0 | 1): number;
  setCache(id: 0 | 1, value: number): void;
}

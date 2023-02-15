import { BodyInterface } from './body.interface';

export interface ConstraintClamping {
  min: number;
  max: number;
}

export interface ConstraintInterface {
  readonly bodyA: BodyInterface | null;
  readonly bodyB: BodyInterface | null;
  getJacobian(out: Float32Array): void;
  getPushFactor(dt: number, strength: number): number;
  getClamping(): ConstraintClamping;
  getCache(id: 0 | 1): number;
  setCache(id: 0 | 1, value: number): void;
}

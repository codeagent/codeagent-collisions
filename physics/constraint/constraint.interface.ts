export interface ConstraintClamping {
  min: number;
  max: number;
}

export interface CsrMatrix {}

export interface ConstraintInterface {
  getJacobian(values: number[], columns: number[]): number;
  getPushFactor(dt: number, strength: number): number;
  getClamping(): ConstraintClamping;
  getCache(id: 0 | 1): number;
  setCache(id: 0 | 1, value: number): void;
}

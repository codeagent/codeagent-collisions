import { mat3 } from 'gl-matrix';
import { Shape } from './shape';

export interface Transformable {
  readonly transform: mat3;
}

export interface ShapeProxy<T = Shape> {
  shape: T;
  transformable: Transformable;
}

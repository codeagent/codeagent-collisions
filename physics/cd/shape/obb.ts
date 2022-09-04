import { mat3, vec2 } from 'gl-matrix';

export interface OBB {
  transform: mat3;
  invTransform: mat3;
  extent: vec2;
}

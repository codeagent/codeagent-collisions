import { vec2 } from 'gl-matrix';

export interface MeshTriangle {
  p0: vec2;
  p1: vec2;
  p2: vec2;
}

export type Mesh = MeshTriangle[];

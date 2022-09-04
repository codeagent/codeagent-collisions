import { vec2 } from 'gl-matrix';

export class MTV {
  vector: vec2 = null; // from shapeIndex
  shapeIndex: -1 | 0 | 1 = -1;
  faceIndex: number = -1;
  depth: number = Number.NEGATIVE_INFINITY;
}

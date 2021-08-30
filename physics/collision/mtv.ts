import { vec2 } from 'gl-matrix';

export class MTV {
  vector: vec2 = null;
  depth: number = Number.NEGATIVE_INFINITY;
  shapeIndex: -1 | 0 | 1 = -1;
  faceIndex: number = -1;
}

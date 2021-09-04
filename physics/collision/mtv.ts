import { vec2 } from 'gl-matrix';
import { Shape } from '../tests';
import { ShapeProxy } from './proxy';

export class MTV {
  // shape0: ShapeProxy<U>;
  // shape1: ShapeProxy<V>;
  vector: vec2 = null; // from shape0 to shape1
  faceIndex: number = -1;
  depth: number = Number.NEGATIVE_INFINITY;

  //@todo: remove
  shapeIndex?: -1 | 0 | 1 = -1;
}


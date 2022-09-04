import { vec2 } from 'gl-matrix';
import { Polygon } from './polygon';

export class Box extends Polygon {
  constructor(readonly width: number, readonly height: number) {
    super([
      vec2.fromValues(-width * 0.5, height * 0.5),
      vec2.fromValues(-width * 0.5, -height * 0.5),
      vec2.fromValues(width * 0.5, -height * 0.5),
      vec2.fromValues(width * 0.5, height * 0.5),
    ]);
  }
}

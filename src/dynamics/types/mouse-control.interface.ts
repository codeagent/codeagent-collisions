import { vec2 } from 'gl-matrix';

export interface MouseControlInterface {
  getCursorPosition(out: vec2): Readonly<vec2>;
}

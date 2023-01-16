import { vec2 } from 'gl-matrix';
import { MouseControlInterface } from 'rb-phys2d';

export class MouseCursor implements MouseControlInterface {
  private readonly cursor = vec2.create();

  getCursorPosition(out: vec2): Readonly<vec2> {
    return vec2.copy(out, this.cursor);
  }

  setCursor(x: number, y: number): void {
    vec2.set(this.cursor, x, y);
  }
}

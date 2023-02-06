import { mat3, vec2 } from 'gl-matrix';

import { isTouchDevice, ortho } from './utils';
import { ViewportInterface } from './viewport.interface';

export interface ViewportAdjustingControlDef {
  origin: vec2;
  width: number;
  minWidth: number;
  maxWidth: number;
  zoomStep: number;
}

export class ViewportAdjustingControl {
  private readonly origin = vec2.create();

  private readonly cursor = vec2.create();

  private readonly offset = vec2.create();

  private scale: number;

  private width: number;

  private readonly invProjMat = mat3.create();

  private readonly onMouseDownHandler = this.onMouseDown.bind(this);

  private readonly onMouseMoveHandler = this.onMouseMove.bind(this);

  private readonly onMouseUpHandler = this.onMouseUp.bind(this);

  private readonly onWheelHandler = this.onWheel.bind(this);

  private readonly onTouchDownHandler = this.onTouchDown.bind(this);

  private readonly onTouchMoveHandler = this.onTouchMove.bind(this);

  private readonly onTouchUpHandler = this.onTouchUp.bind(this);

  constructor(
    public readonly viewport: Readonly<ViewportInterface>,
    public readonly options: Readonly<ViewportAdjustingControlDef>
  ) {
    if (isTouchDevice()) {
      this.viewport.canvas.addEventListener(
        'touchstart',
        this.onTouchDownHandler
      );
    } else {
      this.viewport.canvas.addEventListener(
        'mousedown',
        this.onMouseDownHandler
      );
      this.viewport.canvas.addEventListener('wheel', this.onWheelHandler);
    }

    this.width = options.width;
    vec2.copy(this.origin, options.origin);
  }

  destroy(): void {
    this.viewport.canvas.removeEventListener(
      'mousedown',
      this.onMouseDownHandler
    );
    this.viewport.canvas.removeEventListener(
      'touchstart',
      this.onTouchDownHandler
    );
    self.document.removeEventListener('mousemove', this.onMouseMoveHandler);
    self.document.removeEventListener('touchmove', this.onTouchMoveHandler);
    self.document.removeEventListener('mouseup', this.onMouseUpHandler);
    self.document.removeEventListener('touchend', this.onTouchUpHandler);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 1) {
      mat3.invert(this.invProjMat, this.viewport.projection);

      const { x, y } = this.viewport.canvas.getBoundingClientRect();

      vec2.set(this.cursor, e.clientX - x, e.clientY - y);

      this.unproject(this.cursor, this.cursor);

      vec2.add(this.offset, this.origin, this.cursor);

      self.document.addEventListener('mouseup', this.onMouseUpHandler);
      self.document.addEventListener('mousemove', this.onMouseMoveHandler);

      this.viewport.canvas.style.cursor = 'grabbing';

      e.preventDefault();
    }
  }

  private onTouchDown(e: TouchEvent): void {
    if (e.touches.length === 2) {
      mat3.invert(this.invProjMat, this.viewport.projection);

      const { x, y } = this.viewport.canvas.getBoundingClientRect();

      const touch0 = vec2.create();
      vec2.set(touch0, e.touches[0].clientX - x, e.touches[0].clientY - y);

      this.unproject(touch0, touch0);

      const touch1 = vec2.create();
      vec2.set(touch1, e.touches[1].clientX - x, e.touches[1].clientY - y);

      this.unproject(touch1, touch1);

      vec2.add(this.cursor, touch0, touch1);
      vec2.scale(this.cursor, this.cursor, 0.5);

      this.scale = this.width * vec2.distance(touch0, touch1);
      vec2.add(this.offset, this.origin, this.cursor);

      self.document.addEventListener('touchend', this.onTouchUpHandler);
      self.document.addEventListener('touchmove', this.onTouchMoveHandler);
    }
  }

  private onMouseUp(): void {
    self.document.removeEventListener('mouseup', this.onMouseUpHandler);
    self.document.removeEventListener('mousemove', this.onMouseMoveHandler);

    this.viewport.canvas.style.cursor = 'default';
  }

  private onTouchUp(): void {
    self.document.removeEventListener('touchend', this.onTouchUpHandler);
    self.document.removeEventListener('touchmove', this.onTouchMoveHandler);
  }

  private onMouseMove(e: MouseEvent): void {
    const { x, y } = this.viewport.canvas.getBoundingClientRect();

    vec2.set(this.cursor, e.clientX - x, e.clientY - y);

    this.unproject(this.cursor, this.cursor);

    vec2.sub(this.origin, this.offset, this.cursor);

    this.createProjection();
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 2) {
      const { x, y } = this.viewport.canvas.getBoundingClientRect();

      const touch0 = vec2.create();
      vec2.set(touch0, e.touches[0].clientX - x, e.touches[0].clientY - y);

      this.unproject(touch0, touch0);

      const touch1 = vec2.create();
      vec2.set(touch1, e.touches[1].clientX - x, e.touches[1].clientY - y);

      this.unproject(touch1, touch1);

      vec2.add(this.cursor, touch0, touch1);
      vec2.scale(this.cursor, this.cursor, 0.5);

      vec2.sub(this.origin, this.offset, this.cursor);
      this.width = this.scale / vec2.distance(touch0, touch1);
      this.width = Math.min(
        this.options.maxWidth,
        Math.max(this.options.minWidth, this.width)
      );

      this.createProjection();

      e.stopImmediatePropagation();
    }
  }

  private createProjection(): void {
    const aspect = this.viewport.canvas.width / this.viewport.canvas.height;
    const height = this.width / aspect;

    ortho(
      this.viewport.projection,
      -this.width * 0.5 - this.origin[0],
      this.width * 0.5 - this.origin[0],
      -height * 0.5 - this.origin[1],
      height * 0.5 - this.origin[1]
    );
  }

  private onWheel(event: WheelEvent): void {
    this.width += Math.sign(event.deltaY) * this.options.zoomStep;
    this.width = Math.min(
      this.options.maxWidth,
      Math.max(this.options.minWidth, this.width)
    );

    this.createProjection();
  }

  private unproject(out: vec2, origin: Readonly<vec2>): vec2 {
    vec2.set(
      out,
      (origin[0] / this.viewport.canvas.width) * 2.0 - 1.0,
      (origin[1] / -this.viewport.canvas.height) * 2.0 + 1.0
    );
    return vec2.transformMat3(out, out, this.invProjMat);
  }
}

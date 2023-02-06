import { mat3, vec2 } from 'gl-matrix';
import {
  MouseControlInterface,
  JointInterface,
  WorldInterface,
  BodyInterface,
} from 'rb-phys2d';

import { isTouchDevice } from './utils';
import { ViewportInterface } from './viewport.interface';

export interface MousePickingControlDef {
  stiffness: number;
  maxForce: number;
}

export class MousePickingControl implements MouseControlInterface {
  private body: BodyInterface;

  private joint: JointInterface = null;

  private readonly cursor = vec2.create();

  private readonly invProjMat = mat3.create();

  private readonly onMouseDownHandler = this.onMouseDown.bind(this);

  private readonly onMouseMoveHandler = this.onMouseMove.bind(this);

  private readonly onMouseUpHandler = this.onMouseUp.bind(this);

  private readonly onTouchDownHandler = this.onTouchDown.bind(this);

  private readonly onTouchMoveHandler = this.onTouchMove.bind(this);

  private readonly onTouchUpHandler = this.onTouchUp.bind(this);

  constructor(
    public readonly viewport: Readonly<ViewportInterface>,
    public readonly world: Readonly<WorldInterface>,
    public readonly options: MousePickingControlDef
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
    }
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

  getCursorPosition(out: vec2): Readonly<vec2> {
    return vec2.copy(out, this.cursor);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      mat3.invert(this.invProjMat, this.viewport.projection);

      const { x, y } = this.viewport.canvas.getBoundingClientRect();

      vec2.set(this.cursor, e.clientX - x, e.clientY - y);

      this.unproject(this.cursor, this.cursor);

      this.body = this.getBody(this.cursor);

      if (this.body) {
        self.document.addEventListener('mouseup', this.onMouseUpHandler);
        self.document.addEventListener('mousemove', this.onMouseMoveHandler);

        const joint = vec2.create();
        this.body.toLocalPoint(joint, this.cursor);

        this.joint = this.world.addMouseJoint({
          control: this,
          body: this.body,
          joint,
          stiffness: this.options.stiffness,
          maxForce: this.options.maxForce,
        });
      }
    }
  }

  private onTouchDown(e: TouchEvent): void {
    if (e.touches.length === 1) {
      mat3.invert(this.invProjMat, this.viewport.projection);

      const { x, y } = this.viewport.canvas.getBoundingClientRect();

      vec2.set(this.cursor, e.touches[0].clientX - x, e.touches[0].clientY - y);

      this.unproject(this.cursor, this.cursor);

      this.body = this.getBody(this.cursor);

      if (this.body) {
        self.document.addEventListener('touchend', this.onTouchUpHandler);
        self.document.addEventListener('touchmove', this.onTouchMoveHandler);

        const joint = vec2.create();
        this.body.toLocalPoint(joint, this.cursor);

        this.joint = this.world.addMouseJoint({
          control: this,
          body: this.body,
          joint,
          stiffness: this.options.stiffness,
          maxForce: this.options.maxForce,
        });
      }
    }
  }

  private onMouseUp(): void {
    self.document.removeEventListener('mouseup', this.onMouseUpHandler);
    self.document.removeEventListener('mousemove', this.onMouseMoveHandler);
    this.world.removeJoint(this.joint);

    this.joint = this.body = null;
  }

  private onTouchUp(): void {
    self.document.removeEventListener('touchend', this.onTouchUpHandler);
    self.document.removeEventListener('touchmove', this.onTouchMoveHandler);
    this.world.removeJoint(this.joint);

    this.joint = this.body = null;
  }

  private onMouseMove(e: MouseEvent) {
    const { x, y } = this.viewport.canvas.getBoundingClientRect();

    vec2.set(this.cursor, e.clientX - x, e.clientY - y);

    this.unproject(this.cursor, this.cursor);
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1) {
      const { x, y } = this.viewport.canvas.getBoundingClientRect();

      vec2.set(this.cursor, e.touches[0].clientX - x, e.touches[0].clientY - y);

      this.unproject(this.cursor, this.cursor);

      e.stopImmediatePropagation();
    }
  }

  private unproject(out: vec2, cursor: Readonly<vec2>): vec2 {
    vec2.set(
      out,
      (cursor[0] / this.viewport.canvas.width) * 2.0 - 1.0,
      (cursor[1] / -this.viewport.canvas.height) * 2.0 + 1.0
    );

    return vec2.transformMat3(out, out, this.invProjMat);
  }

  private getBody(point: Readonly<vec2>): BodyInterface {
    const localPoint = vec2.create();

    for (const body of this.world) {
      if (body.isStatic) {
        continue;
      }

      body.toLocalPoint(localPoint, point);

      if (body.collider && body.collider.shape.testPoint(localPoint)) {
        return body;
      }
    }

    return null;
  }
}

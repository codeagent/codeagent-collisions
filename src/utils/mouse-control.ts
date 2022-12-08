import { mat3, vec2, vec3 } from 'gl-matrix';
import { World, Body, MouseJoint, MouseControlInterface } from '../dynamics';

export class MouseControl implements MouseControlInterface {
  private canvas: HTMLElement;
  private body: Body | null;
  private joint: MouseJoint = null;
  private readonly cursor = vec2.create();
  private readonly origin = vec2.create();
  private readonly locked = vec2.create();
  private readonly invProjMat = mat3.create();
  private readonly onMouseDownHandler = this.onMouseDown.bind(this);
  private readonly onMouseMoveHandler = this.onMouseMove.bind(this);
  private readonly onMouseUpHandler = this.onMouseUp.bind(this);
  constructor(
    public readonly world: Readonly<World>,
    public readonly projMatrix: Readonly<mat3>,
    public readonly stiffness: number = 0.95,
    public readonly maxForce: number = 1.0e4
  ) {
    mat3.invert(this.invProjMat, this.projMatrix);
  }

  attach(canvas: HTMLElement): void {
    this.canvas = canvas;
    this.canvas.addEventListener('mousedown', this.onMouseDownHandler);
  }

  release(): void {
    this.canvas.removeEventListener('mousedown', this.onMouseDownHandler);
    self.document.removeEventListener('mousemove', this.onMouseMoveHandler);
    self.document.removeEventListener('mouseup', this.onMouseUpHandler);
  }

  getCursorPosition(out: vec2): Readonly<vec2> {
    return vec2.copy(out, this.cursor);
  }

  private onMouseDown(e: MouseEvent) {
    vec2.copy(this.origin, vec2.fromValues(e.clientX, e.clientY));
    const point = vec2.fromValues(e.offsetX, e.offsetY);
    vec2.transformMat3(point, point, this.invProjMat);
    this.body = this.findBody(point);

    if (!this.body) {
      return;
    }

    self.document.addEventListener('mouseup', this.onMouseUpHandler);
    self.document.addEventListener('mousemove', this.onMouseMoveHandler);

    vec2.copy(this.locked, point);
    vec2.copy(this.cursor, point);

    vec2.transformMat3(point, point, this.body.invTransform);

    this.joint = this.world.addMouseJoint(
      this,
      this.body,
      point,
      this.stiffness,
      this.maxForce
    );
  }

  private onMouseUp() {
    self.document.removeEventListener('mouseup', this.onMouseUpHandler);
    self.document.removeEventListener('mousemove', this.onMouseMoveHandler);
    this.world.removeJoint(this.joint);
    this.joint = this.body = null;
  }

  private onMouseMove(e: MouseEvent) {
    const point = vec3.fromValues(
      e.clientX - this.origin[0],
      e.clientY - this.origin[1],
      0.0
    );
    vec3.transformMat3(point, point, this.invProjMat);
    vec2.set(this.cursor, point[0], point[1]);
    vec2.add(this.cursor, this.cursor, this.locked);
  }

  private findBody(point: Readonly<vec2>): Body | null {
    const invTransform = mat3.create();
    const p = vec2.create();
    for (const body of this.world.bodies) {
      if (body.isStatic) {
        continue;
      }
      mat3.invert(invTransform, body.transform);
      vec2.transformMat3(p, point, invTransform);

      if (body.collider && body.collider.shape.testPoint(p)) {
        return body;
      }
    }
    return null;
  }
}

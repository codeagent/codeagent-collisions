import { mat3, vec2, vec3 } from 'gl-matrix';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, map, filter, tap } from 'rxjs/operators';
import { World, Body, MouseControlInterface, MouseJoint } from './physics';

import { projMat } from './draw';

export class MouseControl implements MouseControlInterface {
  private canvas: HTMLElement;
  private _body: Body | null;
  private joint: MouseJoint = null;
  private readonly release$ = new Subject<void>();
  private readonly stop$ = new Subject<void>();
  private readonly _cursor = vec2.create();
  private readonly origin = vec2.create();
  private readonly locked = vec2.create();
  private readonly invProjMat = mat3.invert(mat3.create(), projMat);

  constructor(
    private readonly world: World,
    public readonly stiffness: number,
    public readonly maxForce: number
  ) {}

  attach(canvas: HTMLElement): void {
    this.canvas = canvas;
    fromEvent(this.canvas, 'mousedown')
      .pipe(
        takeUntil(this.release$),
        tap((e: MouseEvent) =>
          vec2.copy(this.origin, vec2.fromValues(e.clientX, e.clientY))
        ),
        map((e: MouseEvent) => vec2.fromValues(e.offsetX, e.offsetY)),
        map((p) => vec2.transformMat3(p, p, this.invProjMat)),
        tap((p) => (this._body = this.findBody(p))),
        filter(() => this._body !== null)
      )
      .subscribe((p) => this.onMouseDown(p));
  }

  release(): void {
    this.release$.next();
  }

  getCursorPosition(): vec2 {
    return vec2.clone(this._cursor);
  }

  private onMouseDown(p: vec2) {
    fromEvent(self.document, 'mouseup')
      .pipe(takeUntil(this.release$), takeUntil(this.stop$))
      .subscribe(() => this.onMouseUp());

    fromEvent(self.document, 'mousemove')
      .pipe(
        takeUntil(this.release$),
        takeUntil(this.stop$),
        map((e: MouseEvent) =>
          vec3.fromValues(
            e.clientX - this.origin[0],
            e.clientY - this.origin[1],
            0.0
          )
        ),
        map((p: vec3) => vec3.transformMat3(p, p, this.invProjMat)),
        map((p: vec3) => vec2.fromValues(p[0], p[1])),
        map((p: vec2) => vec2.add(p, p, this.locked))
      )
      .subscribe((p) => this.onMouseMove(p));

    vec2.copy(this.locked, p);
    vec2.copy(this._cursor, p);

    const invTransform = mat3.create();
    mat3.invert(invTransform, this._body.transform);
    vec2.transformMat3(p, p, invTransform);

    this.joint = this.world.addMouseJoint(
      this,
      this._body,
      p,
      this.stiffness,
      this.maxForce
    );
  }

  private onMouseUp() {
    this.world.removeJoint(this.joint);
    this.joint = this._body = null;
    this.stop$.next();
  }

  private onMouseMove(p: vec2) {
    vec2.copy(this._cursor, p);
  }

  private findBody(point: vec2): Body | null {
    const invTransform = mat3.create();
    const p = vec2.create();
    for (const body of this.world.bodies) {
      if (body.isStatic) {
        continue;
      }
      mat3.invert(invTransform, body.transform);
      vec2.transformMat3(p, point, invTransform);

      // @todo:
      if (body.collider && body.collider.shape.testPoint(p)) {
        return body;
      }
    }
    return null;
  }
}

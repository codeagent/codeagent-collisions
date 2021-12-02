import { mat3, vec2, vec3 } from 'gl-matrix';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, map, filter, tap } from 'rxjs/operators';
import {
  World,
  Body,
  MouseControlInterface,
  ConstraintInterface,
} from './physics';

import { projMat } from './draw';

export class MouseControl implements MouseControlInterface {
  get cursor(): vec2 {
    return vec2.clone(this._cursor);
  }
  get body(): Body | null {
    return this._body;
  }
  private canvas: HTMLElement;
  private _body: Body | null;
  private constraints: ConstraintInterface[];
  private readonly release$ = new Subject();
  private readonly stop$ = new Subject();
  private readonly _cursor = vec2.create();
  private readonly origin = vec2.create();
  private readonly locked = vec2.create();
  private readonly invProjMat = mat3.invert(mat3.create(), projMat);

  constructor(
    private readonly world: World,
    public readonly stiffness: number,
    public readonly extinction: number
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

    vec2.copy(this.locked, this.body.position);
    vec2.copy(this._cursor, p);

    const invTransform = mat3.create();
    mat3.invert(invTransform, this._body.transform);
    vec2.transformMat3(p, p, invTransform);
    this.constraints = this.world.addMouseConstraints(
      this,
      p,
      this.stiffness,
      this.extinction
    );
  }

  private onMouseUp() {
    this.world.removeConstraint(this.constraints[0]);
    this.world.removeConstraint(this.constraints[1]);
    this.constraints = this._body = null;
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

      const shape = this.world.bodyShape.get(body);
      if (shape.testPoint(p)) {
        return body;
      }
    }
    return null;
  }
}

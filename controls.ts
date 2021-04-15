import { mat3, vec2, vec3 } from "gl-matrix";
import { Observable, Subject, fromEvent } from "rxjs";
import { takeUntil, map, filter, tap } from "rxjs/operators";

import { projMat } from "./draw";
import {
  Body,
  CircleShape,
  PolygonShape,
  testCirclePoint,
  testPolyPoint,
  World
} from "./physics";

const invProjMat = mat3.create();
mat3.invert(invProjMat, projMat);

const containsPoint = (world: World, body: Body, point: vec2) => {
  const shape = world.bodyShapeLookup.get(body);
  if (shape instanceof CircleShape) {
    return testCirclePoint(shape.radius, body.position, point);
  } else if (shape instanceof PolygonShape) {
    return testPolyPoint(shape.points, body.transform, point);
  }
  return false;
};

export class Draggable {
  get start(): Observable<vec2> {
    return this.start$.asObservable();
  }

  get drag(): Observable<vec2> {
    return this.drag$.asObservable();
  }

  get stop(): Observable<vec2> {
    return this.stop$.asObservable();
  }

  private origin = vec2.create();
  private locked = vec2.create();
  private lockedMass = 0.0;
  private drag$ = new Subject<vec2>();
  private start$ = new Subject<vec2>();
  private stop$ = new Subject<vec2>();
  private destroy$ = new Subject();

  constructor(
    protected element: HTMLElement,
    protected world: World,
    protected body: Body
  ) {
    this.init();
  }

  init() {
    fromEvent(this.element, "mousedown")
      .pipe(
        takeUntil(this.destroy$),
        tap((e: MouseEvent) =>
          vec2.copy(this.origin, vec2.fromValues(e.clientX, e.clientY))
        ),

        map((e: MouseEvent) => vec2.fromValues(e.offsetX, e.offsetY)),
        map(p => vec2.transformMat3(p, p, invProjMat)),
        filter(p => containsPoint(this.world, this.body, p))
      )
      .subscribe(() => this.onMouseDown());
  }

  release() {
    this.destroy$.next();
  }

  private onMouseDown() {
    fromEvent(self.document, "mouseup")
      .pipe(
        takeUntil(this.destroy$),
        takeUntil(this.stop$)
      )
      .subscribe(() => this.onMouseUp());

    fromEvent(self.document, "mousemove")
      .pipe(
        takeUntil(this.destroy$),
        takeUntil(this.stop$),
        map((e: MouseEvent) =>
          vec3.fromValues(
            e.clientX - this.origin[0],
            e.clientY - this.origin[1],
            0.0
          )
        ),
        map((p: vec3) => vec3.transformMat3(p, p, invProjMat)),
        map((p: vec3) => vec2.fromValues(p[0], p[1])),
        map((p: vec2) => vec2.add(p, p, this.locked))
      )
      .subscribe(p => this.onMouseMove(p));

    vec2.copy(this.locked, this.body.position);
    this.lockedMass = this.body.mass;
    this.body.mass = Number.POSITIVE_INFINITY;
    this.body.velocity = vec2.create();
    this.body.omega = 0.0;
    this.start$.next(this.body.position);
  }

  private onMouseUp() {
    this.body.mass = this.lockedMass;
    this.stop$.next(this.body.position);
  }

  private onMouseMove(p: vec2) {
    this.body.position = p;
    this.drag$.next(p);
  }
}

export class Rotatable {
  get rot(): Observable<number> {
    return this.rot$.asObservable();
  }

  private rot$ = new Subject<number>();
  private destroy$ = new Subject();

  constructor(
    protected element: HTMLElement,
    protected world: World,
    protected body: Body,
    public readonly speed = Math.PI / 18
  ) {
    this.init();
  }

  init() {
    fromEvent(this.element, "wheel")
      .pipe(
        takeUntil(this.destroy$),
        filter((e: WheelEvent) => {
          const p = vec2.fromValues(e.offsetX, e.offsetY);
          vec2.transformMat3(p, p, invProjMat);
          return containsPoint(this.world, this.body, p);
        })
      )
      .subscribe(e => this.onWheel(e));
  }

  release() {
    this.destroy$.next();
  }

  private onWheel(e: WheelEvent) {
    this.body.angle += Math.sign(e.deltaY) * this.speed;
    this.rot$.next(this.body.angle);
  }
}

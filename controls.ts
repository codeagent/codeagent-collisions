import { vec2 } from "gl-matrix";
import { Observable, Subject, fromEvent } from "rxjs";
import { takeUntil, map, filter, tap } from "rxjs/operators";
import { Body } from "./physics";

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
  private drag$ = new Subject<vec2>();
  private start$ = new Subject<vec2>();
  private stop$ = new Subject<vec2>();
  private destroy$ = new Subject();

  constructor(protected canvasElement: HTMLElement, protected body: Body) {
    this.init();
  }

  init() {
    fromEvent(this.canvasElement, "mousedown")
      .pipe(
        takeUntil(this.destroy$),
        tap((e: MouseEvent) =>
          vec2.copy(this.origin, vec2.fromValues(e.clientX, e.clientY))
        ),
        map((e: MouseEvent) => vec2.fromValues(e.offsetX, e.offsetY)),
        filter(p => this.body.containsPoint(p))
      )
      .subscribe(p => this.onMouseDown(p));
  }

  release() {
    this.destroy$.next();
  }

  private onMouseDown(p: vec2) {
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
          vec2.fromValues(
            e.clientX - this.origin[0] + this.locked[0],
            e.clientY - this.origin[1] + this.locked[1]
          )
        )
      )
      .subscribe(p => this.onMouseMove(p));

    vec2.copy(this.locked, this.body.position);
    this.start$.next(this.body.position);
  }

  private onMouseUp() {
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
    protected canvasElement: HTMLElement,
    protected body: Body,
    public readonly speed = Math.PI / 18
  ) {
    this.init();
  }

  init() {
    fromEvent(this.canvasElement, "wheel")
      .pipe(
        takeUntil(this.destroy$),
        filter((e: WheelEvent) =>
          this.body.containsPoint(vec2.fromValues(e.offsetX, e.offsetY))
        )
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

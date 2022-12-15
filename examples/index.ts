/// <reference path="./declarations.d.ts" />

import { animationFrames, fromEvent, interval } from 'rxjs';
import { configureContainer, MouseControl, World } from 'js-physics-2d';
import { map, startWith, switchMap, tap } from 'rxjs/operators';

import {
  Profiler,
  ExampleLoader,
  RendererInterface,
  Canvas2DRenderer,
  EXAMPLES_TOKEN,
  EXAMPLES,
  RENDERER_TOKEN,
  CONTAINER_TOKEN,
  COLORS_TOKEN,
  COLORS,
} from './services';
import { ExampleInterface } from './example.interface';
import { vec2 } from 'gl-matrix';

const container = configureContainer({});
container.set({ id: EXAMPLES_TOKEN, value: EXAMPLES });
container.set({ id: RENDERER_TOKEN, type: Canvas2DRenderer });
container.set({ id: CONTAINER_TOKEN, value: container });
container.set({ id: COLORS_TOKEN, value: COLORS });

let example: ExampleInterface;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const profiler = container.get(Profiler);
const world = container.get(World);
const loader = container.get(ExampleLoader);
const renderer = container.get<RendererInterface>(RENDERER_TOKEN);
renderer.of(canvas);
const control = new MouseControl(world, renderer.projectionMatrix, 1.0, 1.0e3);
control.attach(canvas);

fromEvent(self.document.querySelectorAll('.nav-link'), 'click')
  .pipe(
    map((e: MouseEvent) => (e.target as HTMLAnchorElement).id),
    startWith('joint'),
    tap((id) => {
      document
        .querySelectorAll('.nav-link')
        .forEach((e) => e.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }),
    switchMap((id: string) => loader.loadExample(id))
  )
  .subscribe((e) => {
    if (example) {
      example.uninstall();
    }
    example = e;
    example.install();
    // Object.assign(world.settings, defaultSettings);
  });

const dt = 1.0 / 60.0;
let statistics = '';
const statisitcsPos = vec2.fromValues(-14.7, 9.5);

interval(dt * 1000).subscribe(() => {
  profiler.begin('step');
  world.step(dt);
  profiler.end('step');
});

animationFrames().subscribe(() => {
  profiler.begin('draw');
  renderer.clear();
  renderer.renderWorld(world);
  renderer.renderText(statistics, statisitcsPos);
  profiler.end('draw');
});

profiler.listen('draw', 'step').subscribe((e) => {
  statistics = `Draw: ${e.draw?.toFixed(2)}ms | Step: ${e.step?.toFixed(2)}ms`;
});

/// <reference path="./declarations.d.ts" />
import 'reflect-metadata';

import { vec2 } from 'gl-matrix';
import { MouseControl } from 'rb-phys2d';
import { Canvas2DRenderer } from 'rb-phys2d-renderer';
import { createWorld } from 'rb-phys2d-threaded';
import { animationFrames, fromEvent, interval } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { Container } from 'typedi';

import { ExampleInterface } from './example.interface';
import {
  Profiler,
  ExampleLoader,
  EXAMPLES_TOKEN,
  EXAMPLES,
  CONTAINER_TOKEN,
  RENDERER_TOKEN,
} from './services';

Container.reset();

const renderer = new Canvas2DRenderer();
const world = createWorld({ workerUrl: 'worker.js' });

const container = Container.of('examples');
container.set({ id: EXAMPLES_TOKEN, value: EXAMPLES });
container.set({ id: CONTAINER_TOKEN, value: container });
container.set({ id: RENDERER_TOKEN, value: renderer });
container.set({ id: 'WORLD', value: world });
container.set({ id: 'SETTINGS', value: world.settings });

let example: ExampleInterface;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const profiler = container.get(Profiler);
const loader = container.get(ExampleLoader);

renderer.of(canvas);
const control = new MouseControl(world, renderer.projectionMatrix, 1.0, 1.0e3);
control.of(canvas);

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

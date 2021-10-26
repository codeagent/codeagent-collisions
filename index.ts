// Import stylesheets
import './style.css';

import { fromEvent, merge, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { canvas, clear, drawWorld } from './draw';
import {
  createPendulumScene,
  createStackScene,
  createStairsScene,
  world,
  createGaussianScene,
  createChainScene,
  createSATScene,
  createJointScene,
  createSuspensionScene,
} from './scene';
import { Draggable, Rotatable } from './controls';
import { satTest } from './physics/collision/test';
import { Profiler } from './physics/profiler';

self['world'] = world;

const lookup = {
  chain: () => createChainScene(20),
  pendulum: () => createPendulumScene(12),
  stairs: () => createStairsScene(8),
  stack: () => createStackScene(128),
  gauss: () => createGaussianScene(),
  sat: () => createSATScene(),
  joint: () => createJointScene(),
  suspension: () => createSuspensionScene(),
};

let rotatables: Rotatable[] = [];
let draggables: Draggable[] = [];
let sceneId: string = '';

merge(
  fromEvent(document.getElementById('chain'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('pendulum'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('stairs'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('stack'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('gauss'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('joint'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('suspension'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('sat'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),

  of('gauss').pipe(delay(1000))
)
  .pipe(
    tap((id) => {
      document
        .querySelectorAll('.nav-link')
        .forEach((e) => e.classList.remove('active'));

      document.getElementById(id).classList.add('active');
    })
  )
  .subscribe((id) => {
    rotatables.forEach((r) => r.release()), (rotatables.length = 0);
    draggables.forEach((d) => d.release()), (draggables.length = 0);
    while (world.bodies.length) world.destroyBody(world.bodies[0]);

    lookup[(sceneId = id)]();
    world.bodies.forEach((b) =>
      draggables.push(new Draggable(canvas, world, b))
    );
    world.bodies.forEach((b) =>
      rotatables.push(new Rotatable(canvas, world, b))
    );
  });

const dt = 1.0 / 60.0;
const step = () => {
  world.simulate(dt);
  clear();

  Profiler.instance.begin('drawWorld');
  drawWorld(world);
  Profiler.instance.end('drawWorld');
  if (sceneId === 'sat') {
    satTest(world);
  }
  requestAnimationFrame(step);
};

step();

Profiler.instance
  .listen('World.integrate')
  .subscribe((e) => console.log('World.integrate', e));

Profiler.instance
  .listen('WorldIsland.projectedGaussSeidel')
  .subscribe((e) => console.log('WorldIsland.projectedGaussSeidel', e));
// Profiler.instance
//   .listen('drawWorld')
//   .subscribe((e) => console.log('drawWorld', e));

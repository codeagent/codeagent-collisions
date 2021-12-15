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
  createJointScene,
  createSuspensionScene,
  createHelixScene,
  pistonScene,
} from './scene';

import { Profiler } from './physics/profiler';
import { MouseControl } from './mouse-control';
import { meshTest } from './physics/collision/mesh-test';

self['world'] = world;

const lookup = {
  chain: () => createChainScene(20),
  pendulum: () => createPendulumScene(12),
  stairs: () => createStairsScene(8),
  stack: () => createStackScene(128),
  gauss: () => createGaussianScene(),
  helix: () => createHelixScene(),
  piston: () => pistonScene(),
  joint: () => createJointScene(),
  suspension: () => createSuspensionScene(),
};

let control: MouseControl;
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
  fromEvent(document.getElementById('piston'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('helix'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),

  of('piston').pipe(delay(1000))
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
    if (control) {
      control.release();
    }
    while (world.bodies.length) world.destroyBody(world.bodies[0]);
    lookup[(sceneId = id)]();
    control = new MouseControl(world, 0.95, 1.0e4);
    control.attach(canvas);
  });

const dt = 1.0 / 60.0;
const step = () => {
  world.simulate(dt);
  clear();

  Profiler.instance.begin('drawWorld');
  drawWorld(world);
  Profiler.instance.end('drawWorld');

  if (sceneId === 'mesh') {
    // meshTest(world);
  }

  requestAnimationFrame(step);
};

step();

// Profiler.instance
//   .listen('World.integrate')
//   .subscribe((e) => console.log('World.integrate', e));

// Profiler.instance
//   .listen('WorldIsland.projectedGaussSeidel')
//   .subscribe((e) => console.log('WorldIsland.projectedGaussSeidel', e));
// Profiler.instance
//   .listen('drawWorld')
//   .subscribe((e) => console.log('drawWorld', e));

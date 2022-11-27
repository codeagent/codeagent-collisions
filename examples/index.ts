/// <reference path="./declarations.d.ts" />

import { animationFrames, fromEvent, merge, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { canvas, clear, drawText, drawWorld, projMat } from './draw';
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
  createMeshScene,
  createPinballScene,
  createGearScene,
  createGjkScene,
  createToiScene,
  createEpaScene,
  createWarmScene,
  createManifoldScene,
} from './scene';

import { MouseControl } from 'js-physics-2d';

import { gjkTest } from './gjk-test';
import { toiTest } from './toi-test';
import { epaTest } from './epa-test';
import { manifoldTest } from './manifold-test';
import { Profiler } from './profiler';

self['world'] = world;

const lookup = {
  chain: () => createChainScene(20),
  pendulum: () => createPendulumScene(12),
  stairs: () => createStairsScene(8),
  stack: () => createStackScene(128),
  gauss: () => createGaussianScene(),
  helix: () => createHelixScene(),
  mesh: () => createMeshScene(),
  piston: () => pistonScene(),
  joint: () => createJointScene(),
  suspension: () => createSuspensionScene(),
  pinball: () => createPinballScene(),
  gears: () => createGearScene(),
  gjk: () => createGjkScene(),
  toi: () => createToiScene(),
  epa: () => createEpaScene(),
  warm: () => createWarmScene(),
  manifold: () => createManifoldScene(),
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
  fromEvent(document.getElementById('mesh'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('pinball'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('gears'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('gjk'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('toi'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('epa'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('warm'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('manifold'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),

  of('joint')
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
    world.dispose();
    lookup[(sceneId = id)]();
    control = new MouseControl(world, projMat);
    control.attach(canvas);
  });

const dt = 1.0 / 60.0;
const profiler = new Profiler();
animationFrames().subscribe(() => {
  profiler.begin('step');
  world.step(dt);
  profiler.end('step');

  clear();

  if (sceneId === 'gjk') {
    gjkTest(world);
  } else if (sceneId === 'toi') {
    toiTest(world, dt);
  } else if (sceneId === 'epa') {
    epaTest(world);
  } else if (sceneId === 'manifold') {
    manifoldTest(world, control);
  }

  profiler.begin('draw');
  drawWorld(world);
  profiler.end('draw');
});

profiler.listen('draw', 'step').subscribe((e) => {
  document.getElementById('step').innerHTML = `${e.step.toFixed(2)}`;
  document.getElementById('draw').innerHTML = `${e.draw.toFixed(2)}`;
});

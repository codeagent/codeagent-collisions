// Import stylesheets
import './style.css';

import { animationFrames, fromEvent, merge, of } from 'rxjs';
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
  createMeshScene,
  createPinballScene,
  createGearScene,
  createWarmScene,
} from './scene';

import { Profiler } from './physics';
import { MouseControl } from './mouse-control';

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
  warm: () => createWarmScene(),
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
  fromEvent(document.getElementById('warm'), 'click').pipe(
    map((e) => e.srcElement['id'])
  ),
  of('joint').pipe(delay(1000))
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
animationFrames().subscribe(() => {
  world.simulate(dt );
  clear();

  Profiler.instance.begin('drawWorld');
  drawWorld(world);
  Profiler.instance.end('drawWorld');
});

Profiler.instance
  .listen(
    'World.integrate',
    'World.detectCollisions',
    'World.updateBodiesTransforms',

    'CollisionDetector.updateAABBs',
    'CollisionDetector.broadPhase',
    'CollisionDetector.narrowPhase',
    'CollisionDetector.narrowPhase',

    'WorldInsland.solve',
    'WorldInsland.getJacobian',
    'WorldInsland.lookup',
    'WorldInsland.MxDxMtCsr',
    'WorldInsland.projectedGaussSeidel',
    'WorldInsland.compress',

    'drawWorld'
  )
  .subscribe((e) => {
    console.clear();
    console.table(e);
  });

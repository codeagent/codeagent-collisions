/// <reference path="./declarations.d.ts" />
import 'reflect-metadata';

import { mat4, vec2, vec4 } from 'gl-matrix';
import { Loop, createWorld, getLoops, polyDecompose } from 'rb-phys2d';
import {
  RenderMask,
  createViewport,
  createWorldRenderer,
} from 'rb-phys2d-renderer';
import { animationFrames } from 'rxjs';
import { Container } from 'typedi';

import { collection, createGometry, toMat4 } from './decomp';
import {
  EXAMPLES_TOKEN,
  EXAMPLES,
  CONTAINER_TOKEN,
  RENDERER_TOKEN,
  Device,
} from './services';
import {
  vertex as shapeVertex,
  fragment as shapeFragment,
} from './shaders/shape';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

canvas.width = Math.max(
  document.documentElement.clientWidth || 0,
  window.innerWidth || 0
);
canvas.height = Math.max(
  document.documentElement.clientHeight || 0,
  window.innerHeight || 0
);

const world = createWorld({});
const viewport = createViewport(canvas)
  .addMousePickingControl(world)
  .addViewportAdjustingControl({ width: 50 });

const renderer = createWorldRenderer(viewport, world);

const container = Container.of('examples');
container.set({ id: EXAMPLES_TOKEN, value: EXAMPLES });
container.set({ id: CONTAINER_TOKEN, value: container });
container.set({ id: RENDERER_TOKEN, value: renderer });
container.set({ id: 'WORLD', value: world });
container.set({ id: 'SETTINGS', value: world.settings });

// collection.GearTrain
// collection.EscapeWheel
// collection.PalletFork
// collection.Balance
// collection.ImpactPinHousing

let loop = getLoops(collection.GearTrain).find(loop => Loop.isCCW(loop));
Loop.check(loop);

// const polygons = polyDecompose(loop);

// Loop.check(polygons[0]);

// Loop.check(loop[0]);
// console.log(loop);

// const loop = Loop.ofVertices([
//   vec2.fromValues(-3.5, 3),
//   vec2.fromValues(-4, -2),
//   vec2.fromValues(0, 1),
//   vec2.fromValues(0, -2),
//   vec2.fromValues(3, 2),
// ]);

// Loop.ofEdges(loop);

const polygons = polyDecompose(loop);
// const polygons = [loop]

const device = new Device(viewport.context);
const shader = device.createShader(shapeVertex, shapeFragment);

const drawable = polygons.map(poly =>
  device.createGeometry(createGometry(poly))
);

const projMat = mat4.create();
const worldMat = mat4.create();
const colorCW = vec4.fromValues(1.0, 0.0, 0.0, 1.0);
const colorCCW = vec4.fromValues(0.0, 0.0, 1.0, 1.0);

animationFrames().subscribe(() => {
  renderer.clear();
  renderer.render(RenderMask.Axes);

  {
    device.useProgram(shader);
    device.setProgramVariable(
      shader,
      'projMat',
      'mat4',
      toMat4(projMat, viewport.projection)
    );
    device.setProgramVariable(shader, 'worldMat', 'mat4', worldMat);

    drawable.forEach((geometry, index) => {
      device.setProgramVariable(shader, 'albedo', 'vec4', colorCCW);
      device.drawGeometry(geometry);
    });
  }
});

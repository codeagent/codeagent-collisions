// Import stylesheets
import './style.css';

import { canvas, clear, drawLineSegment, drawWorld } from './draw';
import {
  createPendulumScene,
  createStackScene,
  createStairsScene,
  world,
  createGaussianScene,
  createChainScene,
  createSATScene
} from './scene';
import { Draggable, Rotatable } from './controls';
import { fromEvent, merge, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { sat } from './physics/sat';
import { Body } from './physics/body';
import { PolygonShape, World } from './physics';
import { vec2 } from 'gl-matrix';

self['world'] = world;

const lookup = {
  chain: () => createChainScene(16),
  pendulum: () => createPendulumScene(12),
  stairs: () => createStairsScene(8),
  stack: () => createStackScene(128),
  gauss: () => createGaussianScene(),
  sat: () => createSATScene()
};

let rotatables: Rotatable[] = [];
let draggables: Draggable[] = [];
let sceneId: string = '';

merge(
  fromEvent(document.getElementById('chain'), 'click').pipe(
    map(e => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('pendulum'), 'click').pipe(
    map(e => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('stairs'), 'click').pipe(
    map(e => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('stack'), 'click').pipe(
    map(e => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('gauss'), 'click').pipe(
    map(e => e.srcElement['id'])
  ),
  fromEvent(document.getElementById('sat'), 'click').pipe(
    map(e => e.srcElement['id'])
  ),
  of('sat').pipe(delay(1000))
)
  .pipe(
    tap(id => {
      document
        .querySelectorAll('.nav-link')
        .forEach(e => e.classList.remove('active'));

      document.getElementById(id).classList.add('active');
    })
  )
  .subscribe(id => {
    rotatables.forEach(r => r.release()), (rotatables.length = 0);
    draggables.forEach(d => d.release()), (draggables.length = 0);
    while (world.bodies.length) world.destroyBody(world.bodies[0]);
    world.constraints.forEach(c => world.removeConstraint(c));
    lookup[(sceneId = id)]();
    world.bodies.forEach(b => draggables.push(new Draggable(canvas, world, b)));
    world.bodies.forEach(b => rotatables.push(new Rotatable(canvas, world, b)));
  });

const dt = 1.0 / 60.0;
const step = () => {
  world.simulate(dt);
  clear();
  drawWorld(world);
  if (sceneId === 'sat') {
    satTest(world);
  }
  requestAnimationFrame(step);
};

step();

const satTest = (world: World) => {
  const shape0 = world.bodyShapeLookup.get(world.bodies[0]) as PolygonShape;
  const shape1 = world.bodyShapeLookup.get(world.bodies[1]) as PolygonShape;
  const poly0 = new sat.Polygon(shape0.points);
  const poly1 = new sat.Polygon(shape1.points);
  const proxy0 = { shape: poly0, transformable: world.bodies[0] };
  const proxy1 = { shape: poly1, transformable: world.bodies[1] };
  const query = new sat.MTVQuery();
  if (sat.testPolyPoly(query, proxy0, proxy1)) {
    const proxy = [proxy0, proxy1][query.polyIndex];
    const p0 = vec2.clone(proxy.shape.points[query.faceIndex]);
    const p1 = vec2.clone(
      proxy.shape.points[(query.faceIndex + 1) % proxy.shape.points.length]
    );
    vec2.transformMat3(p0, p0, proxy.transformable.transform);
    vec2.transformMat3(p1, p1, proxy.transformable.transform);
    drawLineSegment([p0, p1], '#ff0000');

    vec2.scale(query.vector, query.vector, query.depth);
    vec2.add(p1, p0, query.vector);

    drawLineSegment([p0, p1], '#0000ff');
  }
};

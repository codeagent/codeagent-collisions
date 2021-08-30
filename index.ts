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
import { CircleShape } from './physics/world';

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
  const createProxy = (body: Body): sat.ShapeProxy => {
    const shape = world.bodyShapeLookup.get(body);
    if (shape instanceof CircleShape) {
      return {
        shape: new sat.Circle(shape.radius),
        transformable: body
      } as sat.ShapeProxy<sat.Circle>;
    } else if (shape instanceof PolygonShape) {
      return {
        shape: new sat.Polygon(shape.points),
        transformable: body
      } as sat.ShapeProxy<sat.Polygon>;
    }
    return null;
  };

  for (let l = 0; l < world.bodies.length; l++) {
    for (let r = l + 1; r < world.bodies.length; r++) {
      const leftBody = world.bodies[l];
      const rightBody = world.bodies[r];
      const leftProxy = createProxy(leftBody);
      const rightProxy = createProxy(rightBody);

      const query = new sat.MTVQuery();
      if (
        leftProxy.shape instanceof sat.Circle &&
        rightProxy.shape instanceof sat.Circle
      ) {
      } else if (
        leftProxy.shape instanceof sat.Circle &&
        rightProxy.shape instanceof sat.Polygon
      ) {
        sat.testPolyCircle(query, rightProxy, leftProxy);
      } else if (
        leftProxy.shape instanceof sat.Polygon &&
        rightProxy.shape instanceof sat.Circle
      ) {
        sat.testPolyCircle(query, leftProxy, rightProxy);
      } else if (
        leftProxy.shape instanceof sat.Polygon &&
        rightProxy.shape instanceof sat.Polygon
      ) {
        sat.testPolyPoly(query, leftProxy, rightProxy);
      }

      if (query.vector) {
        if (query.faceIndex !== -1) {
          const proxy = [leftProxy, rightProxy][query.shapeIndex];
          const p0 = vec2.clone(proxy.shape.points[query.faceIndex]);
          const p1 = vec2.clone(
            proxy.shape.points[
              (query.faceIndex + 1) % proxy.shape.points.length
            ]
          );
          vec2.transformMat3(p0, p0, proxy.transformable.transform);
          vec2.transformMat3(p1, p1, proxy.transformable.transform);
          drawLineSegment([p0, p1], '#ff0000');

          vec2.scale(query.vector, query.vector, -query.depth);
          vec2.add(p1, p0, query.vector);

          drawLineSegment([p0, p1], '#0000ff');
        } else {
        }
      }
    }
  }
};

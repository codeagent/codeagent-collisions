// Import stylesheets
import './style.css';

import { vec2 } from 'gl-matrix';
import { fromEvent, merge, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';

import {
  canvas,
  clear,
  drawLineSegment,
  drawManifold,
  drawManifoldNew,
  drawWorld
} from './draw';
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
import {
  sat,
  ShapeProxy,
  Polygon,
  Circle,
  MTV,
  getPolyPolyContactManifold,
  ContactManifold
} from './physics/collision';
import { PolygonShape, World, Body, CircleShape } from './physics';

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
  const createProxy = (body: Body): ShapeProxy => {
    const shape = world.bodyShapeLookup.get(body);
    if (shape instanceof CircleShape) {
      return {
        shape: new Circle(shape.radius),
        transformable: body
      } as ShapeProxy<Circle>;
    } else if (shape instanceof PolygonShape) {
      return {
        shape: new Polygon(shape.points),
        transformable: body
      } as ShapeProxy<Polygon>;
    }
    return null;
  };

  for (let l = 0; l < world.bodies.length; l++) {
    for (let r = l + 1; r < world.bodies.length; r++) {
      const leftBody = world.bodies[l];
      const rightBody = world.bodies[r];
      const leftProxy = createProxy(leftBody);
      const rightProxy = createProxy(rightBody);

      const query = new MTV();
      const manifold: ContactManifold = [];
      if (
        leftProxy.shape instanceof Circle &&
        rightProxy.shape instanceof Circle
      ) {
      } else if (
        leftProxy.shape instanceof Circle &&
        rightProxy.shape instanceof Polygon
      ) {
        if (sat.testPolyCircle(query, rightProxy, leftProxy)) {
          // markEdges(query, rightProxy, leftProxy);
        }
      } else if (
        leftProxy.shape instanceof Polygon &&
        rightProxy.shape instanceof Circle
      ) {
        if (sat.testPolyCircle(query, leftProxy, rightProxy)) {
          // markEdges(query, leftProxy, rightProxy);
        }
      } else if (
        leftProxy.shape instanceof Polygon &&
        rightProxy.shape instanceof Polygon
      ) {
        if (sat.testPolyPoly(query, leftProxy, rightProxy)) {
          getPolyPolyContactManifold(manifold, query, leftProxy, rightProxy);

          markEdges(query, leftProxy, rightProxy);
        }
      }

      drawManifoldNew(manifold);
    }
  }
};

const markEdges = (
  query: MTV,
  leftProxy: ShapeProxy<Polygon>,
  rightProxy: ShapeProxy<Polygon>
) => {
  {
    const proxy = [leftProxy, rightProxy][query.shapeIndex];
    const p0 = vec2.clone(proxy.shape.points[query.faceIndex]);
    const p1 = vec2.clone(
      proxy.shape.points[(query.faceIndex + 1) % proxy.shape.points.length]
    );
    vec2.transformMat3(p0, p0, proxy.transformable.transform);
    vec2.transformMat3(p1, p1, proxy.transformable.transform);
    drawLineSegment([p0, p1], '#ff0000');
    vec2.scale(query.vector, query.vector, -query.depth);
    vec2.add(p1, p0, query.vector);
    drawLineSegment([p0, p1], '#0000ff');
  }
};

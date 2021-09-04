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
  Polygon,
  Circle,
  MTV,
  ContactManifold,
  getPolyPolyContactManifold,
  getCircleCircleContactManifold,
  getPolyCircleContactManifold,
  SpaceMapping,
  inverse
} from './physics/collision';

import { PolygonShape, World, Body, CircleShape } from './physics';
import { SpaceMappingInterface } from './physics/collision/space-mapping';
import { Shape } from './physics/collision/shape';

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
  const createShape = (body: Body): Shape => {
    const shape = world.bodyShapeLookup.get(body);
    if (shape instanceof CircleShape) {
      return new Circle(shape.radius);
    } else if (shape instanceof PolygonShape) {
      return new Polygon(shape.points);
    }
    return null;
  };

  for (let l = 0; l < world.bodies.length; l++) {
    for (let r = l + 1; r < world.bodies.length; r++) {
      const leftBody = world.bodies[l];
      const rightBody = world.bodies[r];
      const leftShape = createShape(leftBody);
      const rightShape = createShape(rightBody);

      const query = new MTV();
      let spaceMapping: SpaceMappingInterface = new SpaceMapping(
        leftBody.transform,
        rightBody.transform
      );
      const manifold: ContactManifold = [];
      if (leftShape instanceof Circle && rightShape instanceof Circle) {
        if (sat.testCircleCircle(query, leftShape, rightShape, spaceMapping)) {
          getCircleCircleContactManifold(
            manifold,
            query,
            leftShape,
            rightShape,
            spaceMapping
          );
        }
      } else if (leftShape instanceof Circle && rightShape instanceof Polygon) {
        spaceMapping = inverse(spaceMapping);
        if (sat.testPolyCircle(query, rightShape, leftShape, spaceMapping)) {
          getPolyCircleContactManifold(
            manifold,
            query,
            rightShape,
            leftShape,
            spaceMapping
          );
        }
      } else if (leftShape instanceof Polygon && rightShape instanceof Circle) {
        if (sat.testPolyCircle(query, leftShape, rightShape, spaceMapping)) {
          getPolyCircleContactManifold(
            manifold,
            query,
            leftShape,
            rightShape,
            spaceMapping
          );
        }
      } else if (
        leftShape instanceof Polygon &&
        rightShape instanceof Polygon
      ) {
        if (sat.testPolyPoly(query, leftShape, rightShape, spaceMapping)) {
          getPolyPolyContactManifold(
            manifold,
            query,
            leftShape,
            rightShape,
            spaceMapping
          );

          markPolyEdges(query, leftShape, rightShape, spaceMapping);
        }
      }

      drawManifoldNew(manifold);
    }
  }
};

const markPolyEdges = (
  mtv: MTV,
  leftShape: Polygon,
  rightShape: Polygon,
  spaceMapping: SpaceMappingInterface
) => {
  {
    let reference: Polygon;

    if (mtv.shapeIndex === 0) {
      reference = leftShape;
    } else {
      reference = rightShape;
      spaceMapping = inverse(spaceMapping); // first=reference second=incident
    }

    const p0 = vec2.clone(reference.points[mtv.faceIndex]);
    spaceMapping.fromFirstPoint(p0, p0);

    const p1 = vec2.clone(
      reference.points[(mtv.faceIndex + 1) % reference.points.length]
    );
    spaceMapping.fromFirstPoint(p1, p1);

    drawLineSegment([p0, p1], '#ff0000');
    vec2.scale(mtv.vector, mtv.vector, -mtv.depth);
    vec2.add(p1, p0, mtv.vector);
    drawLineSegment([p0, p1], '#0000ff');
  }
};

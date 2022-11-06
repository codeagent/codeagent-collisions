import { mat3, vec2 } from 'gl-matrix';
import {
  BLUISH_COLOR,
  drawDot,
  drawLineSegment,
  drawText,
  LINE_COLOR,
  REDISH_COLOR,
} from '../../../../draw';

import { World } from '../../../dynamics';
import { SpaceMapping } from '../../../math';
import { mdv, distance } from './gjk';

import { Collider } from '../../collider';

const damping = 10;
const initialDir = vec2.create();
const relError = 1.0e-6;
const maxIterations = 64;
const point0 = vec2.create();
const point1 = vec2.create();
const simplex = new Set<vec2>();
const spacesMapping = new SpaceMapping(mat3.create(), mat3.create());
const sv = vec2.create();

const drawClosestPoints = (point0: vec2, point1: vec2) => {
  drawDot(point0, REDISH_COLOR);
  drawDot(point1, BLUISH_COLOR);
  drawLineSegment([point0, point1], LINE_COLOR);
};

const getClosestPoints = (
  point0: vec2,
  point1: vec2,
  collider0: Readonly<Collider>,
  collider1: Readonly<Collider>
): number => {
  spacesMapping.update(collider0.transform, collider1.transform);
  simplex.clear();
  vec2.sub(initialDir, collider0.body.position, collider1.body.position);

  const dist = distance(
    simplex,
    collider0.shape,
    collider1.shape,
    spacesMapping,
    initialDir,
    0,
    relError,
    maxIterations
  );

  if (dist === 0) {
    return 0;
  }

  mdv(sv, simplex);

  spacesMapping.toSecondVector(point1, sv);
  collider1.shape.support(point1, point1);
  spacesMapping.fromSecondPoint(point1, point1);

  vec2.negate(sv, sv);

  spacesMapping.toFirstVector(point0, sv);
  collider0.shape.support(point0, point0);
  spacesMapping.fromFirstPoint(point0, point0);

  return dist;
};

export const gjkTest = (world: World) => {
  world.bodies.forEach((body) => {
    body.applyForce(
      vec2.fromValues(
        body.mass * -world.gravity[0],
        body.mass * -world.gravity[1]
      )
    );
    body.applyForce(
      vec2.fromValues(damping * -body.velocity[0], damping * -body.velocity[1])
    );
    body.torque = -damping * body.omega;
  });

  const bodies = [
    world.bodies[0],
    world.bodies[1],
    world.bodies[2],
    world.bodies[3],
  ];

  for (let i = 0; i < bodies.length; i++) {
    const body0 = bodies[i];
    const body1 = bodies[(i + 1) % bodies.length];

    let dist = getClosestPoints(point0, point1, body0.collider, body1.collider);

    if (dist !== 0) {
      drawClosestPoints(point0, point1);
      vec2.add(point0, point0, point1);
      vec2.scale(point0, point0, 0.5);
      drawText(`${dist.toFixed(2)}`, point0);
    }
  }
};

import { mat3, vec2 } from 'gl-matrix';
import {
  BLUISH_COLOR,
  drawDot,
  drawLineSegment,
  LINE_COLOR,
  REDISH_COLOR,
} from '../../../../draw';

import { World } from '../../../dynamics';
import { SpaceMapping } from '../../../math';
import { distance } from './gjk';
import { epa } from './epa';
import { Collider } from '../../collider';

const damping = 10;
const point0 = vec2.create();
const point1 = vec2.create();
const initialDir = vec2.create();
const relError = 1.0e-6;
const epsilon = 1.0e-4;
const maxIterations = 25;
const simplex = new Set<vec2>();
const spacesMapping = new SpaceMapping(mat3.create(), mat3.create());
const mtv = vec2.create();

const drawContactPoints = (point0: vec2, point1: vec2) => {
  drawDot(point0, REDISH_COLOR);
  drawDot(point1, BLUISH_COLOR);
  drawLineSegment([point0, point1], LINE_COLOR);
};

const getContactPoints = (
  point0: vec2,
  point1: vec2,
  collider0: Readonly<Collider>,
  collider1: Readonly<Collider>
): boolean => {
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

  if (dist > 0) {
    vec2.zero(point0);
    vec2.zero(point1);
    return false;
  }

  drawSimplex(simplex);

  epa(
    mtv,
    simplex,
    collider0.shape,
    collider1.shape,
    spacesMapping,
    0,
    epsilon,
    maxIterations
  );

  spacesMapping.toFirstVector(point0, mtv);
  collider0.shape.support(point0, point0);
  spacesMapping.fromFirstPoint(point0, point0);

  vec2.negate(mtv, mtv);

  spacesMapping.toSecondVector(point1, mtv);
  collider1.shape.support(point1, point1);
  spacesMapping.fromSecondPoint(point1, point1);

  return true;
};

const drawSimplex = (simplex: Set<vec2>) => {
  const points = [...simplex];
  for (let i = 0; i < points.length; i++) {
    const w0 = points[i];
    const w1 = points[(i + 1) % points.length];
    drawDot(w0, BLUISH_COLOR);

    drawLineSegment([w0, w1], LINE_COLOR);
  }
};

export const epaTest = (world: World) => {
  world.bodies.forEach((body) => {
    body.applyForce(
      vec2.fromValues(
        body.mass * -world.settings.gravity[0],
        body.mass * -world.settings.gravity[1]
      )
    );
    body.applyForce(
      vec2.fromValues(damping * -body.velocity[0], damping * -body.velocity[1])
    );
    body.torque = -damping * body.omega;
  });

  for (let i = 0; i < world.bodies.length; i++) {
    for (let j = i + 1; j < world.bodies.length; j++) {
      const collider0 = world.bodies[i].collider;
      const collider1 = world.bodies[j].collider;

      if (getContactPoints(point0, point1, collider0, collider1)) {
        drawContactPoints(point0, point1);
      }
    }
  }
};

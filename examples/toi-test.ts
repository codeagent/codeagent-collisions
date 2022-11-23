import { mat3, vec2 } from 'gl-matrix';
import { BLUISH_COLOR, drawBody, drawCapsuleShape, LINE_COLOR } from './draw';

import { Body, World, getToi } from 'js-physics-2d';

const damping = 10;

const epsilon = 1.0e-3;
const maxIterations = 32;

const velocity = vec2.fromValues(550, -350);
const omega = Math.PI * 150;

const lerp = (transform: mat3, body: Readonly<Body>, dt: number) => {
  const position = vec2.clone(body.position);
  const velocity = vec2.clone(body.velocity);

  vec2.scaleAndAdd(position, position, velocity, dt);
  const angle = body.angle + body.omega * dt;

  mat3.fromTranslation(transform, position);
  mat3.rotate(transform, transform, angle);
};

const drawSweptVolume = (body: Body, dt: number) => {
  const p0 = vec2.create();
  const p1 = vec2.create();

  vec2.copy(p0, body.position);
  vec2.scaleAndAdd(p1, p0, body.velocity, dt);
  const extend = vec2.dist(p0, p1);
  const angle = vec2.angle(vec2.fromValues(0, 1), body.velocity);

  const transform = mat3.create();
  mat3.fromTranslation(transform, p1);
  mat3.rotate(transform, transform, -angle);
  mat3.translate(transform, transform, vec2.fromValues(0, -extend * 0.5));
  drawCapsuleShape(
    body.collider.shape.radius,
    extend * 0.5,
    transform,
    LINE_COLOR,
    false
  );
};

const drawBodiesImpact = (body0: Body, body1: Body, dt: number) => {
  let currVelocity = vec2.clone(body0.velocity);
  let currOmega = body0.omega;

  body0.velocity = velocity;
  body0.omega = omega;

  const toi = getToi(
    body0,
    body0.collider.shape.radius,
    body1,
    body1.collider.shape.radius,
    dt,
    epsilon,
    maxIterations,
    5.0e-2
  );

  if (toi < 1) {
    const transform = mat3.create();
    lerp(transform, body0, dt * toi);
    drawBody(body0, BLUISH_COLOR, transform);
  }

  drawSweptVolume(body0, dt);

  body0.velocity = currVelocity;
  body0.omega = currOmega;
};

export const toiTest = (world: World, dt: number) => {
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

  const continued = [
    world.bodies[0],
    world.bodies[1],
    world.bodies[2],
    world.bodies[3],
    world.bodies[4],
  ];

  const discreet = [
    world.bodies[5],
    world.bodies[6],
    world.bodies[7],
    world.bodies[8],
    world.bodies[9],
  ];

  for (const c of continued) {
    for (const d of discreet) {
      drawBodiesImpact(c, d, dt);
    }
  }
};

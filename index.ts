// Import stylesheets
import "./style.css";
import { vec2 } from "gl-matrix";

import { clear, drawWorld } from "./draw";
import { World, Body, PolygonShape, BodyShape, CircleShape } from "./physics";

const lerp = (a: number, b: number, t: number) => a * (1.0 - t) + b * t;
const rangeRandom = (from: number, to: number) => lerp(from, to, Math.random());

const createQuadShape = (size: number): BodyShape => {
  return new PolygonShape([
    vec2.fromValues(size * 0.5, -size * 0.5),
    vec2.fromValues(size * 0.5, size * 0.5),
    vec2.fromValues(-size * 0.5, size * 0.5),
    vec2.fromValues(-size * 0.5, -size * 0.5)
  ]);
};

const createRectShape = (w: number, h: number): BodyShape => {
  return new PolygonShape([
    vec2.fromValues(w * 0.5, -h * 0.5),
    vec2.fromValues(w * 0.5, h * 0.5),
    vec2.fromValues(-w * 0.5, h * 0.5),
    vec2.fromValues(-w * 0.5, -h * 0.5)
  ]);
};

// Animated scene

const world = new World();

const createChainScene = (links: number, x = 0.0) => {
  const chain = new Array<Body>(links);
  const size = 0.5;
  const distance = 0.5;
  let offset = Math.SQRT2 * size;

  for (let i = 0; i < links; i++) {
    const body = world.createBody(
      createQuadShape(size),
      i === 0 ? Number.POSITIVE_INFINITY : i == links - 1 ? 5 : 1.0,
      i === 0 ? Number.POSITIVE_INFINITY : i == links - 1 ? 5 : 1.0,
      vec2.fromValues(offset - Math.SQRT2 * size + x, 10),
      -Math.PI * 0.25
    );

    if (i > 0) {
      const bodyA = chain[i - 1];
      const pointA = vec2.fromValues(size * 0.5, size * 0.5);
      const pointB = vec2.fromValues(-size * 0.5, -size * 0.5);
      world.addDistanceConstraint(bodyA, pointA, body, pointB, distance);
    }

    chain[i] = body;
    offset += Math.SQRT2 * size + distance;
  }
};

const createStackScene = (n: number) => {
  // floor
  world.createBody(
    createRectShape(20, 1),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,

    vec2.fromValues(0.0, -9),
    0.0
  );

  // left wall
  world.createBody(
    createRectShape(1, 16),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(-10, 0),
    0.0
  );

  // right wall
  world.createBody(
    createRectShape(1, 16),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(10, 0),
    0.0
  );

  world.createBody(
    new CircleShape(2),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(0, 0),
    0.0
  );

  let offset = 5.0;
  while (n--) {
    world.createBody(
      n % 2 == 1
        ? createRectShape(rangeRandom(1.0, 2.5), rangeRandom(1.0, 2.5))
        : new CircleShape(rangeRandom(1.0, 1.5) * 0.5),
      1.0,
      1.0,
      vec2.fromValues(rangeRandom(-0.1, 0.1), offset),
      0.0
    );

    offset += 2.2;
  }
};

export const createPendulumScene = (n: number) => {
  const step = 1.0;
  const length = 8;
  const m = 1.0;

  world.restitution = 1.0; //elastic bounces
  world.pushFactor = 0.6;

  // ceil
  const ceil = world.createBody(
    createRectShape(20, 1),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(0.0, 10),
    0.0
  );

  let offset = 0;

  while (n--) {
    let pendulum: Body;
    if (n === 1) {
      pendulum = world.createBody(
        new CircleShape(step * 0.5),
        m,
        m,
        vec2.fromValues(
          (n % 2 ? offset : -offset) + length * Math.sin(Math.PI * 0.25),
          length * Math.cos(Math.PI * 0.25)
        ),
        0.0
      );
    } else {
      pendulum = world.createBody(
        new CircleShape(step * 0.5),
        m,
        m,
        vec2.fromValues(n % 2 ? offset : -offset, 0),
        0.0
      );
    }

    world.addDistanceConstraint(
      ceil,
      vec2.fromValues(n % 2 ? offset : -offset, 0.0),
      pendulum,
      vec2.fromValues(0.0, 0.0),
      length
    );

    if (n % 2) {
      offset += step;
    }
  }
};

// createChainScene(14);
// createStackScene(64);
createPendulumScene(8);

self["world"] = world;

const dt = 1.0 / 60.0;

const draw = () => {
  world.simulate(dt);
  clear();
  drawWorld(world);
  requestAnimationFrame(draw);
};

setTimeout(() => draw(), 1000);

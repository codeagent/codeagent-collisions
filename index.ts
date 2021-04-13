// Import stylesheets
import "./style.css";
import { vec2 } from "gl-matrix";

import { clear, canvas, drawWorld } from "./draw";
import { Draggable, Rotatable } from "./controls";
import { Shape, World, Body } from "./physics";

export const clamp = (t: number, from: number, to: number) =>
  Math.max(from, Math.min(to, t));
export const lerp = (a: number, b: number, t: number) => a * (1.0 - t) + b * t;
export const random = Math.random;
export const rangeRandom = (from: number, to: number) =>
  lerp(from, to, random());

const createQuadShape = (size: number): Shape => {
  return [
    vec2.fromValues(size * 0.5, -size * 0.5),
    vec2.fromValues(size * 0.5, size * 0.5),
    vec2.fromValues(-size * 0.5, size * 0.5),
    vec2.fromValues(-size * 0.5, -size * 0.5)
  ];
};

const createRectShape = (w: number, h): Shape => {
  return [
    vec2.fromValues(w * 0.5, -h * 0.5),
    vec2.fromValues(w * 0.5, h * 0.5),
    vec2.fromValues(-w * 0.5, h * 0.5),
    vec2.fromValues(-w * 0.5, -h * 0.5)
  ];
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

  let offset = -5.0;
  while (n--) {
    world.createBody(
      createQuadShape(rangeRandom(1.0, 1.5)),
      1.0,
      1.0,
      vec2.fromValues(0.0, offset),
      0.0
    );

    offset += 2.2;
  }
};

// createChainScene(16);
createStackScene(128);

self["world"] = world;

const dt = 1.0 / 60.0;

const draw = () => {
  world.simulate(dt);
  clear();
  drawWorld(world);
  requestAnimationFrame(draw);
};

setTimeout(() => draw(), 1000);

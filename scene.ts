import { vec2 } from 'gl-matrix';
import { World, Body, Shape, Polygon, Circle } from './physics';

const lerp = (a: number, b: number, t: number) => a * (1.0 - t) + b * t;
const rangeRandom = (from: number, to: number) => lerp(from, to, Math.random());

const createQuadShape = (size: number): Shape => {
  return new Polygon([
    vec2.fromValues(size * 0.5, -size * 0.5),
    vec2.fromValues(size * 0.5, size * 0.5),
    vec2.fromValues(-size * 0.5, size * 0.5),
    vec2.fromValues(-size * 0.5, -size * 0.5)
  ]);
};

const createRectShape = (w: number, h: number): Shape => {
  return new Polygon([
    vec2.fromValues(w * 0.5, -h * 0.5),
    vec2.fromValues(w * 0.5, h * 0.5),
    vec2.fromValues(-w * 0.5, h * 0.5),
    vec2.fromValues(-w * 0.5, -h * 0.5)
  ]);
};

export const world = new World();

export const createChainScene = (links: number, x = 0.0) => {
  world.restitution = 0.5;
  world.pushFactor = 0.25;

  const chain = new Array<Body>(links);
  const size = 0.5;
  const distance = 1.0;
  let offset = Math.SQRT2 * size;
  const m = 1.0;

  for (let i = 0; i < links; i++) {
    const body = world.createBody(
      createQuadShape(size),
      i === 0 || i == links - 1 ? Number.POSITIVE_INFINITY : m,
      i === 0 || i == links - 1 ? Number.POSITIVE_INFINITY : m * 0.1,
      vec2.fromValues(offset - Math.SQRT2 * size + x - 11, 10),
      -Math.PI * 0.25
    );

    if (i > 0) {
      const bodyA = chain[i - 1];
      const pointA = vec2.fromValues(size * 0.5, size * 0.5);
      const pointB = vec2.fromValues(-size * 0.5, -size * 0.5);
      world.addDistanceConstraint(bodyA, pointA, body, pointB, distance);
    }

    chain[i] = body;
    offset += Math.SQRT2 * size + distance * 0.5;
  }
};

export const createStackScene = (n: number) => {
  world.restitution = 0.5;
  world.pushFactor = 0.4;
  world.friction = 0.05;

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
    new Circle(2),
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
        : new Circle(rangeRandom(1.0, 1.5) * 0.5),
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
        new Circle(step * 0.5),
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
        new Circle(step * 0.5),
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

export const createStairsScene = (n: number) => {
  world.restitution = 0.2;
  world.pushFactor = 0.4;
  world.friction = 0.2;

  const w = 6;
  const h = 2.0;
  const xDist = 5.0;
  const yDist = 0.0;
  const m = 10.0;
  const interval = 1000;

  let k = 32;

  const spawn = () => {
    world.createBody(
      new Circle(0.5),
      m,
      m * 0.015,
      vec2.fromValues(w * 0.5, 12),
      0.0
    );
    if (k--) {
      setTimeout(() => spawn(), interval);
    }
  };

  let y = 10.0 - h;
  while (n--) {
    const x = n % 2 ? xDist * 0.5 : -(xDist * 0.5);

    world.createBody(
      createRectShape(w, 0.5),
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(x, y),
      n % 2 ? Math.PI * 0.125 : -Math.PI * 0.125
    );

    y -= h + yDist;
  }

  world.createBody(
    createRectShape(20, 1),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,

    vec2.fromValues(0.0, y - 1),
    0.0
  );

  world.createBody(
    createQuadShape(1),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(-8, y),
    0.0
  );

  world.createBody(
    createQuadShape(1),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(8, y),
    0.0
  );

  spawn();
};

export const createGaussianScene = () => {
  const n = 512;
  let columns = 9;
  let band = 2.0;
  const colW = 0.25;
  const sinkSlope = Math.PI * 0.35;
  let obstacleBands = 10;
  let obstacleMarginX = 2.0;
  let obstacleMarginY = 0.75;
  let obstacleSize = 0.25;
  let ballR = 0.2;

  world.restitution = 0.5;
  world.pushFactor = 0.4;
  world.friction = 0.0;

  // floor
  world.createBody(
    createRectShape(20, 1),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(0.0, -10),
    0.0
  );

  // left wall
  world.createBody(
    createRectShape(0.5, 12),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(-10, -3.5),
    0.0
  );

  // right wall
  world.createBody(
    createRectShape(0.5, 12),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(10, -3.5),
    0.0
  );

  // columns
  let x = 0.0;
  while (columns--) {
    if (columns % 2 == 1) {
      x += band + 0.0;
    }
    world.createBody(
      createRectShape(colW, 7),
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(columns % 2 ? x : -x, -6.0),
      0.0
    );
  }

  // sink
  world.createBody(
    createRectShape(10, 0.5),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(3, 10),
    sinkSlope
  );

  world.createBody(
    createRectShape(10, 0.5),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(-3, 10),
    -sinkSlope
  );

  // obstacles
  let u = 0.0;
  let v = 5.0;

  for (let i = 0; i < obstacleBands; i++) {
    u = -i * obstacleMarginX * 0.5;

    for (let j = 0; j <= i; j++) {
      world.createBody(
        createQuadShape(obstacleSize),
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(u, v),
        Math.PI * 0.25
      );

      u += obstacleMarginX;
    }

    v -= obstacleMarginY;
  }

  // balls
  const r = Math.floor(Math.sqrt(n));

  u = 0.0;
  v = 14.0;

  for (let i = r; i > 0; i--) {
    u = -i * ballR;

    for (let j = i; j >= 0; j--) {
      world.createBody(new Circle(ballR), 1.0, 1.0, vec2.fromValues(u, v), 0.0);

      u += 2.0 * ballR;
    }

    v -= 2.0 * ballR;
  }
};

export const createSATScene = () => {
  world.createBody(
    createRectShape(5, 2),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(-2.0, -5),
    0.0
  );

  world.createBody(
    createRectShape(2, 3),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(2.0, 0),
    0.0
  );

  const w = 3;
  const h = 5;
  world.createBody(
    new Polygon([
      vec2.fromValues(w * 0.5, -h * 0.5),
      vec2.fromValues(w * 0.5, h * 0.5),
      vec2.fromValues(0, h),
      vec2.fromValues(-w * 0.5, h * 0.75),
      vec2.fromValues(-w * 1.0, h * 0.25)
    ]),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(2.0, 0),
    0.0
  );

  world.createBody(
    new Circle(2),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(4, -2),
    0.0
  );

  world.createBody(
    new Circle(3),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(0.0, -5),
    0.0
  );
};

export const createLineScene = () => {
  const lineA = vec2.fromValues(-10, -2);
  const lineB = vec2.fromValues(10, 2);
  const distance = -0.5;

  world.restitution = 0.35;
  world.pushFactor = 0.4;
  world.friction = 0.4;

  const box0 = world.createBody(
    createRectShape(2, 2),
    1,
    1,
    vec2.fromValues(2.0, 2.0),
    0.0
  );
  world.addLineConstraint(box0, lineA, lineB, distance);

  const box1 = world.createBody(
    createRectShape(2, 2),
    1,
    1,
    vec2.fromValues(6, 4.0),
    45
  );
  world.addLineConstraint(box1, lineA, lineB, -distance);

  const sphere = world.createBody(new Circle(1), 1, 1, lineB, 45);
  world.addLineConstraint(sphere, lineA, lineB, 0);

  world.createBody(
    new Circle(2),
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    lineA,
    0.0
  );
};

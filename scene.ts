import { vec2 } from 'gl-matrix';
import {
  World,
  Body,
  Polygon,
  Circle,
  MeshShape,
  loadObj,
  Capsule,
  Collider,
  Ellipse,
  Box,
} from './physics';

import MESH from './objects/mesh';
import GEARS from './objects/gears';
import PINTBALL from './objects/pintball';
import HELIX from './objects/helix';
import PISTON from './objects/piston';

const createQuadShape = (size: number): Polygon => {
  return new Polygon([
    vec2.fromValues(size * 0.5, -size * 0.5),
    vec2.fromValues(size * 0.5, size * 0.5),
    vec2.fromValues(-size * 0.5, size * 0.5),
    vec2.fromValues(-size * 0.5, -size * 0.5),
  ]);
};

const createRectShape = (w: number, h: number): Polygon => {
  return new Polygon([
    vec2.fromValues(w * 0.5, -h * 0.5),
    vec2.fromValues(w * 0.5, h * 0.5),
    vec2.fromValues(-w * 0.5, h * 0.5),
    vec2.fromValues(-w * 0.5, -h * 0.5),
  ]);
};

const createTriangleShape = (r: number = 1): Polygon => {
  return new Polygon([
    vec2.fromValues(-0.5 * r, -0.5 * r),
    vec2.fromValues(0.5 * r, -0.5 * r),
    vec2.fromValues(0.0, 0.5 * r),
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
      i === 0 || i === links - 1 ? Number.POSITIVE_INFINITY : m,
      i === 0 || i === links - 1 ? Number.POSITIVE_INFINITY : m * 0.1,
      vec2.fromValues(offset - Math.SQRT2 * size + x - 11, 10),
      -Math.PI * 0.25
    );
    world.addCollider(new Collider(body, createQuadShape(size)));

    if (i > 0) {
      const bodyA = chain[i - 1];
      const pointA = vec2.fromValues(size * 0.5, size * 0.5);
      const pointB = vec2.fromValues(-size * 0.5, -size * 0.5);
      world.addDistanceJoint(bodyA, pointA, body, pointB, distance);
    }

    chain[i] = body;
    offset += Math.SQRT2 * size + distance * 0.5;
  }
};

export const createStackScene = (n: number) => {
  world.restitution = 0.15;
  world.pushFactor = 0.15;
  world.friction = 0.25;

  // floor
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(0.0, -9),
        0.0
      ),
      createRectShape(26, 1)
    )
  );

  // left wall
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(-14, 0),
        0.0
      ),
      createRectShape(1, 16)
    )
  );

  // right wall
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(14, 0),
        0.0
      ),
      createRectShape(1, 16)
    )
  );

  let box = createRectShape(1, 1);
  let girder = createRectShape(3, 1);
  let capsule = new Capsule(0.5, 3);
  let circle = new Circle(0.5);
  let mass = 1.0;
  let i = 0;

  // boxes
  for (let y = -8.0; y <= 8; y += 1.0) {
    world.addCollider(
      new Collider(
        world.createBody(mass, box.inetria(mass), vec2.fromValues(-12, y), 0.0),
        box
      )
    );
  }

  // box/girder
  for (let y = -8.0; y <= 9; y += 1.0) {
    if (i % 2 === 0) {
      world.addCollider(
        new Collider(
          world.createBody(
            mass,
            box.inetria(mass),
            vec2.fromValues(-9.5, y),
            0
          ),
          box
        )
      );

      world.addCollider(
        new Collider(
          world.createBody(
            mass,
            box.inetria(mass),
            vec2.fromValues(-6.5, y),
            0
          ),
          box
        )
      );
    } else {
      world.addCollider(
        new Collider(
          world.createBody(
            mass,
            girder.inetria(mass),
            vec2.fromValues(-8, y),
            0
          ),
          girder
        )
      );
    }

    i++;
  }

  // circle/girder
  for (let y = -8.0; y <= 9; y += 1.0) {
    if (i % 2 === 0) {
      world.addCollider(
        new Collider(
          world.createBody(mass, mass * 20, vec2.fromValues(-5, y), 0),
          circle
        )
      );

      world.addCollider(
        new Collider(
          world.createBody(mass, mass * 20, vec2.fromValues(-3, y), 0),
          circle
        )
      );
    } else {
      world.addCollider(
        new Collider(
          world.createBody(mass, mass * 20, vec2.fromValues(-4, y), 0),
          girder
        )
      );
    }

    i++;
  }

  // box/capsule
  for (let y = -8.0; y <= 8; y += 1.0) {
    if (i % 2 === 0) {
      world.addCollider(
        new Collider(
          world.createBody(1.0, 2.0, vec2.fromValues(-1.0, y), 0),
          box
        )
      );

      world.addCollider(
        new Collider(
          world.createBody(1.0, 2.0, vec2.fromValues(1.0, y), 0),
          box
        )
      );
    } else {
      world.addCollider(
        new Collider(
          world.createBody(1.0, 2.0, vec2.fromValues(0, y), Math.PI * 0.5),
          capsule
        )
      );
    }

    i++;
  }

  // circles
  for (let y = -8.0; y <= 8; y += 1.0) {
    world.addCollider(
      new Collider(
        world.createBody(
          mass,
          circle.inetria(mass) * 4,
          vec2.fromValues(3, y),
          0.0
        ),
        circle
      )
    );
  }

  // capsules
  for (let y = -8.0; y <= 8; y += 1.0) {
    world.addCollider(
      new Collider(
        world.createBody(mass, mass * 2, vec2.fromValues(6, y), Math.PI * 0.5),
        capsule
      )
    );
  }

  //capsule/circle
  for (let y = -8.0; y <= 2; y += 1.0) {
    if (i % 2 === 0) {
      world.addCollider(
        new Collider(
          world.createBody(mass, mass * 20, vec2.fromValues(10.0, y), 0),
          circle
        )
      );

      world.addCollider(
        new Collider(
          world.createBody(mass, mass * 20, vec2.fromValues(12.0, y), 0),
          circle
        )
      );
    } else {
      world.addCollider(
        new Collider(
          world.createBody(
            mass,
            mass * 1,
            vec2.fromValues(11, y),
            Math.PI * 0.5
          ),
          capsule
        )
      );
    }

    i++;
  }
};

export const createPendulumScene = (n: number) => {
  const step = 1.0;
  const length = 8;
  const m = 1.0;

  world.restitution = 1.0; //elastic bounces
  world.pushFactor = 0.96;
  world.friction = 0.0;

  // ceil
  const ceil = world.createBody(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(0.0, 10),
    0.0
  );
  world.addCollider(new Collider(ceil, createRectShape(20, 1)));

  let offset = 0;

  while (n--) {
    let pendulum: Body;
    if (n === 1) {
      pendulum = world.createBody(
        m,
        m,
        vec2.fromValues(
          (n % 2 ? offset : -offset) + length * Math.sin(Math.PI * 0.25),
          length * Math.cos(Math.PI * 0.25)
        ),
        0.0
      );
      world.addCollider(new Collider(pendulum, new Circle(step * 0.5)));
    } else {
      pendulum = world.createBody(
        m,
        m,
        vec2.fromValues(n % 2 ? offset : -offset, 0),
        0.0
      );
      world.addCollider(new Collider(pendulum, new Circle(step * 0.5)));
    }

    world.addDistanceJoint(
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

  let k = 1;

  const spawn = () => {
    world.addCollider(
      new Collider(
        world.createBody(m, m * 0.015, vec2.fromValues(w * 0.5, 12), 0.0),
        new Circle(0.5)
      )
    );
    if (k--) {
      setTimeout(() => spawn(), interval);
    }
  };

  let y = 10.0 - h;
  while (n--) {
    const x = n % 2 ? xDist * 0.5 : -(xDist * 0.5);

    world.addCollider(
      new Collider(
        world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(x, y),
          n % 2 ? Math.PI * 0.125 : -Math.PI * 0.125
        ),
        createRectShape(w, 0.5)
      )
    );

    y -= h + yDist;
  }

  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(0.0, y - 1),
        0.0
      ),
      createRectShape(20, 1)
    )
  );

  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(-8, y),
        0.0
      ),
      createQuadShape(1)
    )
  );

  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(8, y),
        0.0
      ),
      createQuadShape(1)
    )
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
  world.friction = 0.3;

  // floor
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(0.0, -10),
        0.0
      ),
      createRectShape(20, 1)
    )
  );

  // left wall
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(-10, -3.5),
        0.0
      ),
      createRectShape(0.5, 12)
    )
  );

  // right wall
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(10, -3.5),
        0.0
      ),
      createRectShape(0.5, 12)
    )
  );

  // columns
  let x = 0.0;
  while (columns--) {
    if (columns % 2 == 1) {
      x += band + 0.0;
    }
    world.addCollider(
      new Collider(
        world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(columns % 2 ? x : -x, -6.0),
          0.0
        ),
        createRectShape(colW, 7)
      )
    );
  }

  // sink
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(3, 10),
        sinkSlope
      ),
      createRectShape(10, 0.5)
    )
  );

  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(-3, 10),
        -sinkSlope
      ),
      createRectShape(10, 0.5)
    )
  );

  // obstacles
  let u = 0.0;
  let v = 5.0;

  for (let i = 0; i < obstacleBands; i++) {
    u = -i * obstacleMarginX * 0.5;

    for (let j = 0; j <= i; j++) {
      world.addCollider(
        new Collider(
          world.createBody(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            vec2.fromValues(u, v),
            Math.PI * 0.25
          ),
          createQuadShape(obstacleSize)
        )
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
      world.addCollider(
        new Collider(
          world.createBody(1.0, 1.0, vec2.fromValues(u, v), 0.0),
          new Circle(ballR)
        )
      );

      u += 2.0 * ballR;
    }

    v -= 2.0 * ballR;
  }
};

export const createJointScene = () => {
  world.restitution = 0.35;
  world.pushFactor = 0.65;
  world.friction = 0.55;

  const wheel = world.createBody(
    Number.POSITIVE_INFINITY,
    1.0,
    vec2.fromValues(-10.0, 0.0),
    0.0
  );
  world.addCollider(new Collider(wheel, new Circle(2)));

  setTimeout(() => {
    world.addCollider(
      new Collider(
        world.createBody(10, 10.0, vec2.fromValues(-10.0, -5.0), 0.0),
        new Circle(1)
      )
    );
  }, 2000);

  const bar = world.createBody(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(0.0, -1.5),
    0.0
  );
  world.addCollider(new Collider(bar, createRectShape(10, 0.1)));

  const slider = world.createBody(1, 1, vec2.fromValues(0.0, -1), 0.0);
  world.addCollider(new Collider(slider, createRectShape(3, 0.5)));

  world.addPrismaticJoint(
    bar,
    vec2.fromValues(0, 0.45),
    slider,
    vec2.fromValues(0, 0),
    vec2.fromValues(1.0, 0)
  );

  world.addDistanceJoint(
    wheel,
    vec2.fromValues(0, 1.75),
    slider,
    vec2.fromValues(0, 0),
    6
  );

  world.addMotor(wheel, 2, 75.0);

  // stack
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(-3, 3.5),
        0.0
      ),
      createRectShape(0.1, 8)
    )
  );

  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(-4, 3.5),
        0.0
      ),
      createRectShape(0.1, 8)
    )
  );

  let n = 10;
  while (n--) {
    world.addCollider(
      new Collider(
        world.createBody(1, 1, vec2.fromValues(-3.5, n), 0.0),
        createRectShape(0.85, 0.85)
      )
    );
  }

  // swing
  const swing = world.createBody(
    Number.POSITIVE_INFINITY,
    1,
    vec2.fromValues(5.0, -5.5),
    0.0
  );
  world.addCollider(new Collider(swing, createRectShape(5.5, 0.1)));

  const ball = world.createBody(1.1, 0.1, vec2.fromValues(5.0, -8.0), 0.0);
  world.addCollider(new Collider(ball, new Circle(0.5)));

  const cube = world.createBody(1.1, 0.1, vec2.fromValues(3.0, -8.0), 0.0);
  world.addCollider(new Collider(cube, createRectShape(1.0, 1.0)));

  world.addSpring(
    ball,
    vec2.fromValues(0.5, 0.0),
    cube,
    vec2.fromValues(0.0, 0.0),
    1.0,
    50.0,
    20
  );

  // floor
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(0.0, -9),
        0.0
      ),
      createRectShape(16, 1)
    )
  );

  // chain
  {
    const links = 40;
    const chain = new Array<Body>(links);
    const size = 0.5;
    const o = vec2.fromValues(-10.0, 0.0);
    const m = 1.0;
    const r = 4;
    const dPhi = (2 * Math.PI) / links;
    let phi = 0.0;

    for (let i = 0; i < links; i++) {
      const x = o[0] + r * Math.cos(phi);
      const y = o[1] + r * Math.sin(phi);

      const body = world.createBody(m, m, vec2.fromValues(x, y), phi);
      world.addCollider(new Collider(body, createRectShape(size, size * 0.5)));

      if (i > 0) {
        const bodyA = chain[i - 1];
        const pointA = vec2.fromValues(size * 0.65, 0.0);
        const pointB = vec2.fromValues(-size * 0.65, 0.0);
        world.addRevoluteJoint(bodyA, pointA, body, pointB);
      }

      if (i === links - 1) {
        const bodyA = body;
        const bodyB = chain[0];
        const pointA = vec2.fromValues(size * 0.65, 0.0);
        const pointB = vec2.fromValues(-size * 0.65, 0.0);
        world.addRevoluteJoint(bodyA, pointA, bodyB, pointB);
      }

      chain[i] = body;

      phi += dPhi;
    }
  }
};

export const createSuspensionScene = () => {
  world.restitution = 0.35;
  world.pushFactor = 0.65;
  world.friction = 0.55;

  const stiffness = 25;
  const exstinction = 1;

  let length = 6;
  const hull = world.createBody(1.0, 1.0, vec2.fromValues(10.0, -4.0), 0.0);
  world.addCollider(new Collider(hull, createRectShape(length, 1.0)));

  let wheels = 4;
  for (let i = 0; i < wheels; i++) {
    const wheel = world.createBody(1.1, 1.1, vec2.fromValues(8.5, -6.0), 0.0);
    world.addCollider(new Collider(wheel, new Circle(0.5)));

    world.addWheelJonit(
      hull,
      vec2.fromValues((length / (wheels - 1)) * i - length * 0.5, -0.5),
      wheel,
      vec2.fromValues(0.0, 0.0),
      vec2.fromValues(0.0, 1.0),
      1,
      3
    );

    world.addSpring(
      hull,
      vec2.fromValues((length / (wheels - 1)) * i - length * 0.5, -0.5),
      wheel,
      vec2.fromValues(0.0, 0.0),
      2,
      stiffness,
      exstinction
    );

    world.addMotor(wheel, Math.PI, 55);
  }

  // left wall
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(-14, 0),
        0.0
      ),
      createRectShape(0.25, 16)
    )
  );

  // right wall
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(14, 0),
        0.0
      ),
      createRectShape(0.25, 16)
    )
  );

  // floor
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(0.0, -9),
        0.0
      ),
      createRectShape(30, 1)
    )
  );

  // obstacles
  let n = 8;
  while (n--) {
    world.addCollider(
      new Collider(
        world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(n * 2 - 12.0, -8.5),
          Math.PI * 0.25
        ),
        new Circle(0.2)
      )
    );
  }
};

export const createHelixScene = () => {
  world.restitution = 0.25;
  world.pushFactor = 0.65;
  world.friction = 0.75;

  world.addCollider(
    new Collider(
      world.createBody(10, 1.0, vec2.fromValues(0.0, 0.5), Math.PI * 0.25),
      new Circle(0.5)
    )
  );

  const collection = loadObj(HELIX);

  for (const object in collection) {
    world.addCollider(
      new Collider(
        world.createBody(
          Number.POSITIVE_INFINITY,
          10,
          vec2.fromValues(0, 0),
          0
        ),
        new MeshShape(collection[object])
      )
    );
  }
};

export const createPinballScene = () => {
  world.restitution = 0.75;
  world.pushFactor = 0.65;
  world.friction = 0.75;

  world.addCollider(
    new Collider(
      world.createBody(10, 1, vec2.fromValues(0.0, 6.5), Math.PI * 0.25),
      new Circle(0.25)
    )
  );

  const collection = loadObj(PINTBALL);

  for (const object in collection) {
    world.addCollider(
      new Collider(
        world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(0, 0),
          0
        ),
        new MeshShape(collection[object])
      )
    );
  }
};

export const createMeshScene = () => {
  world.restitution = 0.25;
  world.pushFactor = 0.65;
  world.friction = 0.75;

  world.addCollider(
    new Collider(
      world.createBody(10, 1, vec2.fromValues(0.0, 6.5), Math.PI * 0.25),
      new Circle(0.5)
    )
  );

  const collection = loadObj(MESH);

  for (const object in collection) {
    world.addCollider(
      new Collider(
        world.createBody(10, 100, vec2.fromValues(0, 0), 0),
        new MeshShape(collection[object])
      )
    );
  }

  // left wall
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(-14, 0),
        0.0
      ),
      createRectShape(0.25, 16)
    )
  );

  // right wall
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(14, 0),
        0.0
      ),
      createRectShape(0.25, 16)
    )
  );

  // floor
  world.addCollider(
    new Collider(
      world.createBody(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        vec2.fromValues(0.0, -9),
        0.0
      ),
      createRectShape(30, 1)
    )
  );
};

export const pistonScene = () => {
  world.restitution = 0.25;
  world.pushFactor = 0.65;
  world.friction = 0.75;

  world.addCollider(
    new Collider(
      world.createBody(1, 0.1, vec2.fromValues(0.0, 10.0), Math.PI * 0.25),
      new Circle(1.5)
    )
  );

  const collection = loadObj(PISTON);

  const cylinder = world.createBody(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(0, 0),
    0
  );
  world.addCollider(
    new Collider(cylinder, new MeshShape(collection['cylinder']))
  );

  const piston = world.createBody(1, 1, vec2.fromValues(0, -1), 0);
  world.addCollider(new Collider(piston, new MeshShape(collection['piston'])));

  world.addPrismaticJoint(
    cylinder,
    vec2.create(),
    piston,
    vec2.create(),
    vec2.fromValues(0.0, 1.0),
    0,
    0.05,
    4
  );

  world.addSpring(
    cylinder,
    vec2.create(),
    piston,
    vec2.create(),
    1.0,
    1000.0,
    10.0
  );
};

export const createGearScene = () => {
  world.restitution = 0.25;
  world.pushFactor = 0.65;
  world.friction = 0.75;

  const collection = loadObj(GEARS);

  // for (const object in collection) {
  const motor = world.createBody(
    Number.POSITIVE_INFINITY,
    10,
    vec2.fromValues(0, 0),
    0
  );
  world.addMotor(motor, 10.0, 1.0);
  world.addCollider(
    new Collider(motor, new MeshShape(collection['gear_o_049']))
  );

  const gear0 = world.createBody(
    Number.POSITIVE_INFINITY,
    10,
    vec2.fromValues(-6.4191, 0),
    0
  );
  world.addCollider(new Collider(gear0, new MeshShape(collection['gear_051'])));

  const gear1 = world.createBody(
    Number.POSITIVE_INFINITY,
    10,
    vec2.fromValues(-0.8335, 9.7032),
    0
  );
  world.addCollider(new Collider(gear1, new MeshShape(collection['gear_052'])));

  const gear2 = world.createBody(
    Number.POSITIVE_INFINITY,
    10,
    vec2.fromValues(6.3478, 6.1935),
    0
  );
  world.addCollider(new Collider(gear2, new MeshShape(collection['gear_049'])));

  const gear3 = world.createBody(
    Number.POSITIVE_INFINITY,
    10,
    vec2.fromValues(9.0431, -1.3321),
    0
  );

  world.addCollider(
    new Collider(gear3, new MeshShape(collection['gear_o_052']))
  );

  const gear4 = world.createBody(
    Number.POSITIVE_INFINITY,
    10,
    vec2.fromValues(1.7793, -7.6031),
    0
  );

  world.addCollider(
    new Collider(gear4, new MeshShape(collection['gear_o_050']))
  );
};

export const createGjkScene = () => {
  // Scene
  let body = world.createBody(1.0, 1.0, vec2.fromValues(-4, -6), 0.0);
  world.addCollider(new Collider(body, createRectShape(1, 1), 0x01));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, -6), 0.0);
  world.addCollider(new Collider(body, createTriangleShape(3), 0x02));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, 6), 0.0);
  world.addCollider(new Collider(body, new Capsule(1, 4), 0x04));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-4, 6), 0.0);
  world.addCollider(new Collider(body, new Ellipse(3, 2), 0x08));
};

export const createToiScene = () => {
  const objects = loadObj(GEARS);

  // "continued - moving" objects
  let body = world.createBody(1.0, 1.0, vec2.fromValues(6, 8), Math.PI * 0.75);
  world.addCollider(new Collider(body, new Box(2, 1), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(6, 4), Math.PI * 0.75);
  world.addCollider(new Collider(body, new Capsule(0.5, 1.5), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(6, -0), Math.PI * 0.75);
  world.addCollider(new Collider(body, new Circle(1), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(6, -4), Math.PI * 0.75);
  world.addCollider(new Collider(body, new Ellipse(1.0, 0.5), 0));

  body = world.createBody(1, 1, vec2.fromValues(6, -8), Math.PI * 0.75);
  world.addCollider(
    new Collider(body, new MeshShape(objects['gear_o_049']), 0)
  );

  // "descrete" objects
  body = world.createBody(1.0, 1.0, vec2.fromValues(-6, 8), 0);
  world.addCollider(new Collider(body, new Box(2, 1), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-6, 4), 0);
  world.addCollider(new Collider(body, new Capsule(0.5, 1.5), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-6, -0), 0);
  world.addCollider(new Collider(body, new Circle(1), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-6, -4), 0);
  world.addCollider(new Collider(body, new Ellipse(1.0, 0.5), 0));

  body = world.createBody(1, 1, vec2.fromValues(-6, -8), 0);
  world.addCollider(
    new Collider(body, new MeshShape(objects['gear_o_049']), 0)
  );
};

export const createEpaScene = () => {
  const objects = loadObj(GEARS);

  let body: Body = null;

  body = world.createBody(
    1.0,
    1.0,
    vec2.fromValues(-2.1968839168548584, 6.876863956451416),
    Math.PI * 0.75
  );
  world.addCollider(new Collider(body, new Box(2, 1), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, 4), Math.PI * 0.0);
  world.addCollider(new Collider(body, new Capsule(0.5, 1.5), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, 0), Math.PI * 0.0);
  world.addCollider(new Collider(body, new Circle(1), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, -4), Math.PI * 0.75);
  world.addCollider(new Collider(body, new Ellipse(1.0, 0.5), 0));

  body = world.createBody(1, 1, vec2.fromValues(4, -8), Math.PI * 0.75);
  world.addCollider(
    new Collider(body, new MeshShape(objects['gear_o_049']), 0)
  );

  body = world.createBody(1.0, 1.0, vec2.fromValues(-4, 7.983665943145752), 0);
  world.addCollider(new Collider(body, new Box(2, 1), 0x01));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-4, 4), 0);
  world.addCollider(new Collider(body, new Capsule(0.5, 1.5), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-4, -0), 0);
  world.addCollider(new Collider(body, new Circle(1), 0x04));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-4, -4), 0);
  world.addCollider(new Collider(body, new Ellipse(1.0, 0.5), 0));

  body = world.createBody(1, 1, vec2.fromValues(-4, -8), 0);
  world.addCollider(
    new Collider(body, new MeshShape(objects['gear_o_049']), 0)
  );
};

export const createWarmScene = () => {
  world.restitution = 0.0;
  world.pushFactor = 0.7;
  world.friction = 0.27;

  // floor
  let body = world.createBody(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    vec2.fromValues(0.0, -9),
    0.0
  );
  world.addCollider(new Collider(body, createRectShape(20, 1.1)));

  const omega = Math.PI * 1.0;
  const velocity = vec2.fromValues(0.0, -1000.0);

  let box1 = world.createBody(1.0, 1.0, vec2.fromValues(-2, 0), Math.PI, true);
  box1.omega = omega;
  box1.velocity = velocity;
  world.addCollider(
    new Collider(
      box1,
      new Polygon([
        vec2.fromValues(0.5, -0.5),
        vec2.fromValues(0.5, 0.5),
        vec2.fromValues(-0.5, 0.5),
        vec2.fromValues(-1.5, 0.0),
      ])
    )
  );

  let box2 = world.createBody(
    1.0,
    1.0,
    vec2.fromValues(2, 0),
    Math.PI * 0.25,
    false
  );
  box2.omega = omega;
  box2.velocity = velocity;
  world.addCollider(new Collider(box2, createRectShape(1, 1)));
};

export const createManifoldScene = () => {
  world.restitution = 0.5;
  world.pushFactor = 0.95;
  world.friction = 0.7;

  const objects = loadObj(GEARS);

  let body: Body;

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, 8), Math.PI * 0.75);
  world.addCollider(new Collider(body, new Box(4, 2), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, 4), Math.PI * 0.5);
  world.addCollider(new Collider(body, new Capsule(1.0, 3.5), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, 0), Math.PI * 0.0);
  world.addCollider(new Collider(body, new Circle(1.5), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4, -4), Math.PI * 0.75);
  world.addCollider(new Collider(body, new Ellipse(2.0, 1.5), 0));

  body = world.createBody(1, 1, vec2.fromValues(4, -8), Math.PI * 0.75);
  world.addCollider(
    new Collider(body, new MeshShape(objects['gear_o_049']), 0)
  );

  //
  body = world.createBody(1.0, 1.0, vec2.fromValues(-4, 8), 0);
  world.addCollider(new Collider(body, new Box(4, 2), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(4.5, 5.5), Math.PI * 0.55);
  world.addCollider(new Collider(body, new Capsule(1.0, 3.5), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-4, -0), 0);
  world.addCollider(new Collider(body, new Circle(2.0), 0));

  body = world.createBody(1.0, 1.0, vec2.fromValues(-4, -4), 0);
  world.addCollider(new Collider(body, new Ellipse(2.0, 1.0), 0));

  body = world.createBody(1, 1, vec2.fromValues(-4, -8), 0);
  world.addCollider(
    new Collider(body, new MeshShape(objects['gear_o_049']), 0)
  );
};

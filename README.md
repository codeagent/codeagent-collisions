[![CI](https://github.com/codeagent/rb-phys2d/actions/workflows/ci.yml/badge.svg)](https://github.com/codeagent/rb-phys2d/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/rb-phys2d.svg)](https://badge.fury.io/js/rb-phys2d)

# RbPhys2D

JavaScript and Typescript rigid body 2d physics engine primarily devised to create complex scenes involved various types of joints and shapes.

[Examples](https://rb-phys2d.stackblitz.io/)

## Features

- `Circle`, `Box`, `Ellipse`, `Capsule`, `Polygon`
- Continuous Collision Detection (only between convex shapes yet)
- Concave `Mesh Shape`
- Lifecycle `Events`
- `Distance`, `Prismatic`, `Revolute`, `Weld`, `Wheel`, `Spring`, `Mouse`, `Motor` Joints
- Physical Material Features: `Restitution`, `Friction`, `Damping`
- Bodies `Sleeping`
- World `Islands`
- [Force-Based Constraint Solver](http://www.mft-spirit.nl/files/MTamis_ConstraintBasedPhysicsSolver.pdf)

## Installation

Using `npm` package manager:

```bash
npm install rb-phys2d
```

## Getting started

### ESM

1. Install additional npm package for drawing world onto canvas element:

```bash
npm install rb-phys2d-renderer
```

2. Create world:

```typescript
// gl-matrix is nessesary for vector/matrix operations
import { vec2 } from 'gl-matrix';
// include Box shape and world factory
import { Box, createWorld } from "rb-phys2d";
// stuff for rendering and interacting with world through canvas
import { createViewport, createWorldRenderer } from "rb-phys2d-renderer";

// world is main entry point for almost all api
const world = createWorld({ ... })

```

3. Fill world with bodies:

```typescript
// create static floor
const floor = world.createBody({
  position: vec2.fromValues(0, -5),
  mass: Number.POSITIVE_INFINITY,
  inertia: Number.POSITIVE_INFINITY,
});
world.addCollider({ shape: new Box(10, 2), body: floor });

// create dynamic box
const box = world.createBody({ mass: 1 });
world.addCollider({ shape: new Box(1, 1), body: box });
```

4. Create viewport and promote world through main loop:

```typescript
const canvas = document.getElementById('canvas');

const viewport = createViewport(canvas)
  .addMousePickingControl(world)
  .addViewportAdjustingControl();

const renderer = createWorldRenderer(viewport, world);

// it is frame duration in seconds
const dt = 0.0167;

const step = () => {
  // world simulation starts here
  world.step(dt);

  // here all rendering happen
  renderer.clear();
  renderer.render();

  requestAnimationFrame(step);
};

requestAnimationFrame(step);
```

See full source code and life demo [here](https://stackblitz.com/edit/rb-phys2d-getting-started?file=index.ts).

### Browser

1. Include necessary bundles into html page

```html
<script src="./node_modules/gl-matrix/gl-matrix.js"></script>
<script src="./node_modules/rb-phys2d/dist/bundle/rb-phys2d.js"></script>
<script src="./node_modules/rb-phys2d-renderer/dist/bundle/rb-phys2d-renderer.js"></script>
```

2. Use the global accessible objects `rbPhys2d` and `rbPhys2dRenderer` to get access to api.

## Extensions And Plugins

- [rb-phys2d-renderer](https://github.com/codeagent/rb-phys2d-renderer) for world rendering, mouse picking and viewport adjusting
- [rb-phys2d-threaded](https://github.com/codeagent/rb-phys2d-threaded) for launching `rb-phys2d` in dedicated WebWorker

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)

// Import stylesheets
import "./style.css";

import { canvas, clear, drawWorld } from "./draw";
import {
  createPendulumScene,
  createStackScene,
  createStairsScene,
  world,
  createGaussianScene,
  createChainScene
} from "./scene";
import { Draggable, Rotatable } from "./controls";

self["world"] = world;

const dt = 1.0 / 60.0;

const step = () => {
  world.simulate(dt);
  clear();
  drawWorld(world);
  requestAnimationFrame(step);
};

setTimeout(() => {
  createChainScene(16);
  // createPendulumScene(12);
  // createStairsScene(8);
  // createStackScene(128);
  // createGaussianScene()

  world.bodies.forEach(b => new Draggable(canvas, world, b));
  world.bodies.forEach(b => new Rotatable(canvas, world, b));

  step();
}, 1000);

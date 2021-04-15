// Import stylesheets
import "./style.css";

import { clear, drawWorld } from "./draw";
import {
  createPendulumScene,
  createStackScene,
  createStairsScene,
  world,
  createGuassianScene,
  createChainScene
} from "./scene";

self["world"] = world;

const dt = 1.0 / 60.0;

const step = () => {
  world.simulate(dt);
  clear();
  drawWorld(world);
  requestAnimationFrame(step);
};

setTimeout(() => {
  // createChainScene(16);
  // createPendulumScene(8)
  // createStairsScene(8);
  createStackScene(64);
  // createGuassianScene()
  step();
}, 1000);

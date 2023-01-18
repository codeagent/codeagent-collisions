import { vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  loadObj,
  Circle,
  MeshShape,
} from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';
import HELIX from './objects/helix.obj';

@Service()
export class HelixExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.25;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.75;

    this.createHelix();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createHelix() {
    this.world.addCollider({
      body: this.world.createBody({
        mass: 10,
        inertia: 1.0,
        position: vec2.fromValues(0.0, 0.5),
        angle: Math.PI * 0.25,
      }),
      shape: new Circle(0.5),
    });

    const collection = loadObj(HELIX);

    for (const object in collection) {
      this.world.addCollider({
        body: this.world.createBody({
          mass: Number.POSITIVE_INFINITY,
          inertia: 10,
          position: vec2.fromValues(0, 0),
          angle: 0,
        }),
        shape: new MeshShape(collection[object]),
      });
    }
  }
}

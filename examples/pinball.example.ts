import { vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  Circle,
  loadObj,
  MeshShape,
} from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';
import PINTBALL from './objects/pintball.obj';

@Service()
export class PinballExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultPushFactor = 0.65;

    this.createPinball();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createPinball(): void {
    this.world.addCollider({
      body: this.world.createBody({
        mass: 10,
        inertia: 1,
        position: vec2.fromValues(0.0, 6.5),
        angle: Math.PI * 0.25,
      }),
      shape: new Circle(0.25),
    });

    const collection = loadObj(PINTBALL);

    for (const object in collection) {
      this.world.addCollider({
        body: this.world.createBody({
          mass: Number.POSITIVE_INFINITY,
          inertia: Number.POSITIVE_INFINITY,
          position: vec2.fromValues(0, 0),
          angle: 0,
        }),
        shape: new MeshShape(collection[object]),
      });
    }
  }
}

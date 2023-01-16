import { vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  Box,
  Collider,
  MeshShape,
  Circle,
  loadObj,
} from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';
import MESH from './objects/mesh.obj';

@Service()
export class MeshExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.25;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.75;

    this.createMesh();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createMesh() {
    this.world.addCollider({
      body: this.world.createBody({
        mass: 10,
        inertia: 1,
        position: vec2.fromValues(0.0, 6.5),
        angle: Math.PI * 0.25,
      }),
      shape: new Circle(0.5),
    });

    const collection = loadObj(MESH);

    for (const object in collection) {
      this.world.addCollider({
        body: this.world.createBody({
          mass: 10,
          inertia: 100,
          position: vec2.fromValues(0, 0),
          angle: 0,
        }),
        shape: new MeshShape(collection[object]),
      });
    }

    // left wall
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-14, 0),
      }),
      shape: new Box(0.25, 16),
    });

    // right wall
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(14, 0),
      }),
      shape: new Box(0.25, 16),
    });

    // floor
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(0.0, -9),
      }),
      shape: new Box(30, 1),
    });
  }
}

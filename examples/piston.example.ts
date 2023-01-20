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
import PISTON from './objects/piston.obj';

@Service()
export class PistonExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.25;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.75;

    this.createPiston();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createPiston() {
    this.world.addCollider({
      body: this.world.createBody({
        mass: 1,
        inertia: 0.1,
        position: vec2.fromValues(0.0, 10.0),
        angle: Math.PI * 0.25,
      }),
      shape: new Circle(1.5),
    });

    const collection = loadObj(PISTON);

    const cylinder = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: Number.POSITIVE_INFINITY,
      position: vec2.fromValues(0, 0),
      angle: 0,
    });
    this.world.addCollider({
      body: cylinder,
      shape: new MeshShape(collection.cylinder),
    });

    const piston = this.world.createBody({
      mass: 1,
      inertia: 1,
      position: vec2.fromValues(0, -1),
      angle: 0,
    });
    this.world.addCollider({
      body: piston,
      shape: new MeshShape(collection.piston),
    });

    this.world.addPrismaticJoint({
      bodyA: cylinder,
      bodyB: piston,
      localAxis: vec2.fromValues(0.0, 1.0),
      minDistance: 0.05,
      maxDistance: 4,
    });

    this.world.addSpring({
      bodyA: cylinder,
      bodyB: piston,
      distance: 1.0,
      extinction: 10,
      stiffness: 1000,
    });
  }
}

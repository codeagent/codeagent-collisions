import { vec2 } from 'gl-matrix';
import { WorldInterface, Settings, loadObj, MeshShape } from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';
import GEARS from './objects/gears.obj';

@Service()
export class GearsExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.25;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultPushFactor = 0.45;

    this.createGears();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createGears() {
    const collection = loadObj(GEARS);

    // for (const object in collection) {
    const motor = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: 10,
      position: vec2.fromValues(0, 0),
      angle: 0,
    });
    this.world.addMotor({ body: motor, speed: 15.0, torque: 5.0 });
    this.world.addCollider({
      body: motor,
      shape: new MeshShape(collection['gear_o_049']),
    });

    const gear0 = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: 10,
      position: vec2.fromValues(-6.4191, 0),
      angle: 0,
    });
    this.world.addCollider({
      body: gear0,
      shape: new MeshShape(collection['gear_051']),
    });

    const gear1 = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: 10,
      position: vec2.fromValues(-0.8335, 9.7032),
      angle: 0,
    });
    this.world.addCollider({
      body: gear1,
      shape: new MeshShape(collection['gear_052']),
    });

    const gear2 = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: 10,
      position: vec2.fromValues(6.3478, 6.1935),
      angle: 0,
    });
    this.world.addCollider({
      body: gear2,
      shape: new MeshShape(collection['gear_049']),
    });

    const gear3 = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: 10,
      position: vec2.fromValues(9.0431, -1.3321),
      angle: 0,
    });

    this.world.addCollider({
      body: gear3,
      shape: new MeshShape(collection['gear_o_052']),
    });

    const gear4 = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: 10,
      position: vec2.fromValues(1.7793, -7.6031),
      angle: 0,
    });

    this.world.addCollider({
      body: gear4,
      shape: new MeshShape(collection['gear_o_050']),
    });
  }
}

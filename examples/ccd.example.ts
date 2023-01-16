import { vec2 } from 'gl-matrix';
import {
  Settings,
  Box,
  Collider,
  Polygon,
  WorldInterface,
} from 'rb-phys2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class CcdExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.0;
    this.settings.defaultPushFactor = 0.7;
    this.settings.defaultFriction = 0.27;

    this.createObjects();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createObjects() {
    // floor
    let body = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: Number.POSITIVE_INFINITY,
      position: vec2.fromValues(0.0, -9),
    });
    this.world.addCollider({ body: body, shape: new Box(20, 0.1) });

    const omega = Math.PI * 1.0;
    const velocity = vec2.fromValues(0.0, -10000.0);

    let box1 = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(-2, 0),
      angle: Math.PI,
      isContinuos: true,
    });
    box1.omega = omega;
    box1.velocity = velocity;
    this.world.addCollider({
      body: box1,
      shape: new Polygon([
        vec2.fromValues(0.5, -0.5),
        vec2.fromValues(0.5, 0.5),
        vec2.fromValues(-0.5, 0.5),
        vec2.fromValues(-1.5, 0.0),
      ]),
    });

    let box2 = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(2, 0),
      angle: Math.PI * 0.25,
    });
    box2.omega = omega;
    box2.velocity = velocity;
    this.world.addCollider({ body: box2, shape: new Box(1, 1) });
  }
}

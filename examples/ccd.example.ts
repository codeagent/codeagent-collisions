import { vec2 } from 'gl-matrix';
import { World, Settings, Box, Collider, Body, Polygon } from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class CcdExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.0;
    this.settings.defaultPushFactor = 0.7;
    this.settings.defaultFriction = 0.27;

    this.createObjects();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createObjects() {
    // floor
    let body = this.world.createBody(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(0.0, -9),
      0.0
    );
    this.world.addCollider(new Collider(body, new Box(20, 1.1)));

    const omega = Math.PI * 1.0;
    const velocity = vec2.fromValues(0.0, -10000.0);

    let box1 = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(-2, 0),
      Math.PI,
      true
    );
    box1.omega = omega;
    box1.velocity = velocity;
    this.world.addCollider(
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

    let box2 = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(2, 0),
      Math.PI * 0.25,
      false
    );
    box2.omega = omega;
    box2.velocity = velocity;
    this.world.addCollider(new Collider(box2, new Box(1, 1)));
  }
}

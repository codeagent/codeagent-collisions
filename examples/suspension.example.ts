import { vec2 } from 'gl-matrix';
import { WorldInterface, Settings, Box, Circle } from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';

@Service()
export class SuspensionExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultPushFactor = 0.65;

    this.createSuspension();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createSuspension(): void {
    const stiffness = 25;
    const extinction = 1;

    const length = 6;
    const hull = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position: vec2.fromValues(10.0, -4.0),
      angle: 0.0,
    });
    this.world.addCollider({ body: hull, shape: new Box(length, 1.0) });

    const wheels = 4;
    for (let i = 0; i < wheels; i++) {
      const wheel = this.world.createBody({
        mass: 1.1,
        inertia: 1.1,
        position: vec2.fromValues(8.5, -6.0),
        angle: 0.0,
      });
      this.world.addCollider({ body: wheel, shape: new Circle(0.5) });

      this.world.addWheelJonit({
        bodyA: hull,
        pivotA: vec2.fromValues(
          (length / (wheels - 1)) * i - length * 0.5,
          -0.5
        ),
        bodyB: wheel,
        localAxis: vec2.fromValues(0.0, -1.0),
        minDistance: 1,
        maxDistance: 3,
      });

      this.world.addSpring({
        bodyA: hull,
        pivotA: vec2.fromValues(
          (length / (wheels - 1)) * i - length * 0.5,
          -0.5
        ),
        bodyB: wheel,
        distance: 2,
        stiffness,
        extinction,
      });

      this.world.addMotor({ body: wheel, speed: Math.PI, torque: 55 });
    }

    // left wall
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-14, 0),
        angle: 0.0,
      }),
      shape: new Box(0.25, 16),
    });

    // right wall
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(14, 0),
        angle: 0.0,
      }),
      shape: new Box(0.25, 16),
    });

    // floor
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(0.0, -9),
        angle: 0.0,
      }),
      shape: new Box(30, 1),
    });

    // obstacles
    let n = 8;
    while (n--) {
      this.world.addCollider({
        body: this.world.createBody({
          mass: Number.POSITIVE_INFINITY,
          inertia: Number.POSITIVE_INFINITY,
          position: vec2.fromValues(n * 2 - 12.0, -8.5),
          angle: Math.PI * 0.25,
        }),
        shape: new Circle(0.2),
      });
    }
  }
}

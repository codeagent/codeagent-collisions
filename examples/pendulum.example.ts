import { vec2 } from 'gl-matrix';
import { World, Settings, Box, Collider, Body, Circle } from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class PendulumExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 1.0; //elastic bounces
    this.settings.defaultPushFactor = 0.95;
    this.settings.defaultFriction = 0.0;

    this.createPendulums(12);
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createPendulums(n: number) {
    const step = 1.0;
    const length = 8;
    const m = 1.0;

    // ceil
    const ceil = this.world.createBody(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(0.0, 10),
      0.0
    );
    this.world.addCollider(new Collider(ceil, new Box(20, 1)));

    let offset = 0;

    while (n--) {
      let pendulum: Body;
      if (n === 1) {
        pendulum = this.world.createBody(
          m,
          m,
          vec2.fromValues(
            (n % 2 ? offset : -offset) + length * Math.sin(Math.PI * 0.25),
            length * Math.cos(Math.PI * 0.25)
          ),
          0.0
        );
        this.world.addCollider(new Collider(pendulum, new Circle(step * 0.5)));
      } else {
        pendulum = this.world.createBody(
          m,
          m,
          vec2.fromValues(n % 2 ? offset : -offset, 0),
          0.0
        );
        this.world.addCollider(new Collider(pendulum, new Circle(step * 0.5)));
      }

      this.world.addDistanceJoint(
        ceil,
        vec2.fromValues(n % 2 ? offset : -offset, 0.0),
        pendulum,
        vec2.fromValues(0.0, 0.0),
        length
      );

      if (n % 2) {
        offset += step;
      }
    }
  }
}

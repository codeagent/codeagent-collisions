import { vec2 } from 'gl-matrix';
import { World, Settings, Box, Collider, Circle } from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class SuspensionExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.35;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.55;

    this.createSuspension();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createSuspension() {
    const stiffness = 25;
    const exstinction = 1;

    let length = 6;
    const hull = this.world.createBody(
      1.0,
      1.0,
      vec2.fromValues(10.0, -4.0),
      0.0
    );
    this.world.addCollider(new Collider(hull, new Box(length, 1.0)));

    let wheels = 4;
    for (let i = 0; i < wheels; i++) {
      const wheel = this.world.createBody(
        1.1,
        1.1,
        vec2.fromValues(8.5, -6.0),
        0.0
      );
      this.world.addCollider(new Collider(wheel, new Circle(0.5)));

      this.world.addWheelJonit(
        hull,
        vec2.fromValues((length / (wheels - 1)) * i - length * 0.5, -0.5),
        wheel,
        vec2.fromValues(0.0, 0.0),
        vec2.fromValues(0.0, 1.0),
        1,
        3
      );

      this.world.addSpring(
        hull,
        vec2.fromValues((length / (wheels - 1)) * i - length * 0.5, -0.5),
        wheel,
        vec2.fromValues(0.0, 0.0),
        2,
        stiffness,
        exstinction
      );

      this.world.addMotor(wheel, Math.PI, 55);
    }

    // left wall
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(-14, 0),
          0.0
        ),
        new Box(0.25, 16)
      )
    );

    // right wall
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(14, 0),
          0.0
        ),
        new Box(0.25, 16)
      )
    );

    // floor
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(0.0, -9),
          0.0
        ),
        new Box(30, 1)
      )
    );

    // obstacles
    let n = 8;
    while (n--) {
      this.world.addCollider(
        new Collider(
          this.world.createBody(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            vec2.fromValues(n * 2 - 12.0, -8.5),
            Math.PI * 0.25
          ),
          new Circle(0.2)
        )
      );
    }
  }
}

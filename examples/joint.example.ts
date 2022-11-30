import { World, Settings, Box, Collider, Body, Circle } from 'js-physics-2d';
import { vec2 } from 'gl-matrix';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class JointExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.35;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.55;

    this.createJoints();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createJoints() {
    const wheel = this.world.createBody(
      Number.POSITIVE_INFINITY,
      1.0,
      vec2.fromValues(-10.0, 0.0),
      0.0
    );
    this.world.addCollider(new Collider(wheel, new Circle(2)));

    setTimeout(() => {
      this.world.addCollider(
        new Collider(
          this.world.createBody(10, 10.0, vec2.fromValues(-10.0, -5.0), 0.0),
          new Circle(1)
        )
      );
    }, 2000);

    const bar = this.world.createBody(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(0.0, -1.5),
      0.0
    );
    this.world.addCollider(new Collider(bar, new Box(10, 0.1)));

    const slider = this.world.createBody(1, 1, vec2.fromValues(0.0, -1), 0.0);
    this.world.addCollider(new Collider(slider, new Box(3, 0.5)));

    this.world.addPrismaticJoint(
      bar,
      vec2.fromValues(0, 0.45),
      slider,
      vec2.fromValues(0, 0),
      vec2.fromValues(1.0, 0)
    );

    this.world.addDistanceJoint(
      wheel,
      vec2.fromValues(0, 1.75),
      slider,
      vec2.fromValues(0, 0),
      6
    );

    this.world.addMotor(wheel, 2, 75.0);

    // stack
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(-3, 3.5),
          0.0
        ),
        new Box(0.1, 8)
      )
    );

    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(-4, 3.5),
          0.0
        ),
        new Box(0.1, 8)
      )
    );

    let n = 10;
    while (n--) {
      this.world.addCollider(
        new Collider(
          this.world.createBody(1, 1, vec2.fromValues(-3.5, n), 0.0),
          new Box(0.85, 0.85)
        )
      );
    }

    // swing
    const swing = this.world.createBody(
      Number.POSITIVE_INFINITY,
      1,
      vec2.fromValues(5.0, -5.5),
      0.0
    );
    this.world.addCollider(new Collider(swing, new Box(5.5, 0.1)));

    const ball = this.world.createBody(
      1.1,
      0.1,
      vec2.fromValues(5.0, -8.0),
      0.0
    );
    this.world.addCollider(new Collider(ball, new Circle(0.5)));

    const cube = this.world.createBody(
      1.1,
      0.1,
      vec2.fromValues(3.0, -8.0),
      0.0
    );
    this.world.addCollider(new Collider(cube, new Box(1.0, 1.0)));

    this.world.addSpring(
      ball,
      vec2.fromValues(0.5, 0.0),
      cube,
      vec2.fromValues(0.0, 0.0),
      1.0,
      50.0,
      20
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
        new Box(16, 1)
      )
    );

    // chain
    {
      const links = 40;
      const chain = new Array<Body>(links);
      const size = 0.5;
      const o = vec2.fromValues(-10.0, 0.0);
      const m = 1.0;
      const r = 4;
      const dPhi = (2 * Math.PI) / links;
      let phi = 0.0;

      for (let i = 0; i < links; i++) {
        const x = o[0] + r * Math.cos(phi);
        const y = o[1] + r * Math.sin(phi);

        const body = this.world.createBody(m, m, vec2.fromValues(x, y), phi);
        this.world.addCollider(new Collider(body, new Box(size, size * 0.5)));

        if (i > 0) {
          const bodyA = chain[i - 1];
          const pointA = vec2.fromValues(size * 0.65, 0.0);
          const pointB = vec2.fromValues(-size * 0.65, 0.0);
          this.world.addRevoluteJoint(bodyA, pointA, body, pointB);
        }

        if (i === links - 1) {
          const bodyA = body;
          const bodyB = chain[0];
          const pointA = vec2.fromValues(size * 0.65, 0.0);
          const pointB = vec2.fromValues(-size * 0.65, 0.0);
          this.world.addRevoluteJoint(bodyA, pointA, bodyB, pointB);
        }

        chain[i] = body;

        phi += dPhi;
      }
    }
  }
}

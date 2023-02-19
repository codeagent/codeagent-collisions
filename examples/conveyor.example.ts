import { vec2 } from 'gl-matrix';
import {
  WorldInterface,
  Settings,
  Box,
  Circle,
  BodyInterface,
} from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';

@Service()
export class ConveyorExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultPushFactor = 0.65;

    this.createJoints();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createJoints(): void {
    const wheel = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: 1.0,
      position: vec2.fromValues(-10.0, 0.0),
    });
    this.world.addCollider({ body: wheel, shape: new Circle(2) });

    setTimeout(() => {
      this.world.addCollider({
        body: this.world.createBody({
          mass: 10,
          inertia: 10.0,
          position: vec2.fromValues(-10.0, -5.0),
        }),
        shape: new Circle(1),
      });
    }, 2000);

    const bar = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: Number.POSITIVE_INFINITY,
      position: vec2.fromValues(0.0, -1.5),
    });
    this.world.addCollider({ body: bar, shape: new Box(10, 0.1) });

    const slider = this.world.createBody({
      mass: 1,
      inertia: 1,
      position: vec2.fromValues(0.0, -1),
    });
    this.world.addCollider({ body: slider, shape: new Box(3, 0.5) });

    this.world.addPrismaticJoint({
      bodyA: bar,
      pivotA: vec2.fromValues(0, 0.45),
      bodyB: slider,
    });

    this.world.addDistanceJoint({
      bodyA: wheel,
      pivotA: vec2.fromValues(0, 1.75),
      bodyB: slider,
      pivotB: vec2.fromValues(0, 0),
      distance: 6.0,
    });

    this.world.addMotor({ body: wheel, speed: 2, torque: 75.0 });

    // stack
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-3, 3.5),
      }),
      shape: new Box(0.1, 8),
    });

    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-4, 3.5),
      }),
      shape: new Box(0.1, 8),
    });

    let n = 10;
    while (n--) {
      this.world.addCollider({
        body: this.world.createBody({
          mass: 1,
          inertia: 1,
          position: vec2.fromValues(-3.5, n),
        }),
        shape: new Box(0.85, 0.85),
      });
    }

    // swing
    const swing = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: 1,
      position: vec2.fromValues(5.0, -5.5),
    });
    this.world.addCollider({ body: swing, shape: new Box(5.5, 0.1) });

    const ball = this.world.createBody({
      mass: 1.1,
      inertia: 0.1,
      position: vec2.fromValues(5.0, -8.0),
    });
    this.world.addCollider({ body: ball, shape: new Circle(0.5) });

    const cube = this.world.createBody({
      mass: 1.1,
      inertia: 0.1,
      position: vec2.fromValues(3.0, -8.0),
    });
    this.world.addCollider({ body: cube, shape: new Box(1.0, 1.0) });

    this.world.addSpring({
      bodyA: ball,
      pivotA: vec2.fromValues(0.5, 0.0),
      bodyB: cube,
      distance: 1.0,
      stiffness: 40,
      extinction: 2,
    });

    // floor
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(0.0, -9),
      }),
      shape: new Box(16, 1),
    });

    // chain
    {
      const links = 40;
      const chain = new Array<BodyInterface>(links);
      const size = 0.5;
      const o = vec2.fromValues(-10.0, 0.0);
      const m = 1.0;
      const r = 4;
      const dPhi = (2 * Math.PI) / links;
      let phi = 0.0;

      for (let i = 0; i < links; i++) {
        const x = o[0] + r * Math.cos(phi);
        const y = o[1] + r * Math.sin(phi);

        const body = this.world.createBody({
          mass: m,
          inertia: m,
          position: vec2.fromValues(x, y),
          angle: phi,
        });
        this.world.addCollider({
          body: body,
          shape: new Box(size, size * 0.5),
        });

        if (i > 0) {
          const bodyA = chain[i - 1];
          const pointA = vec2.fromValues(size * 0.65, 0.0);
          const pointB = vec2.fromValues(-size * 0.65, 0.0);
          this.world.addRevoluteJoint({
            bodyA,
            pivotA: pointA,
            bodyB: body,
            pivotB: pointB,
          });
        }

        if (i === links - 1) {
          const bodyA = body;
          const bodyB = chain[0];
          const pointA = vec2.fromValues(size * 0.65, 0.0);
          const pointB = vec2.fromValues(-size * 0.65, 0.0);
          this.world.addRevoluteJoint({
            bodyA,
            pivotA: pointA,
            bodyB,
            pivotB: pointB,
          });
        }

        chain[i] = body;

        phi += dPhi;
      }
    }
  }
}

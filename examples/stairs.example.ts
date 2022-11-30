import { vec2 } from 'gl-matrix';
import { World, Settings, Box, Collider, Circle } from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class StairsExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.2;
    this.settings.defaultPushFactor = 0.4;
    this.settings.defaultFriction = 0.2;

    this.createStairs(8);
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createStairs(n: number) {
    Object.assign(this.world.settings, { defaultRestitution: 0.2 });
    Object.assign(this.world.settings, { defaultPushFactor: 0.4 });
    Object.assign(this.world.settings, { defaultFriction: 0.2 });

    const w = 6;
    const h = 2.0;
    const xDist = 5.0;
    const yDist = 0.0;
    const m = 10.0;
    const interval = 1000;

    let k = 1;

    const spawn = () => {
      this.world.addCollider(
        new Collider(
          this.world.createBody(
            m,
            m * 0.015,
            vec2.fromValues(w * 0.5, 12),
            0.0
          ),
          new Circle(0.5)
        )
      );
      if (k--) {
        setTimeout(() => spawn(), interval);
      }
    };

    let y = 10.0 - h;
    while (n--) {
      const x = n % 2 ? xDist * 0.5 : -(xDist * 0.5);

      this.world.addCollider(
        new Collider(
          this.world.createBody(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            vec2.fromValues(x, y),
            n % 2 ? Math.PI * 0.125 : -Math.PI * 0.125
          ),
          new Box(w, 0.5)
        )
      );

      y -= h + yDist;
    }

    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(0.0, y - 1),
          0.0
        ),
        new Box(20, 1)
      )
    );

    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(-8, y),
          0.0
        ),
        new Box(1, 1)
      )
    );

    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(8, y),
          0.0
        ),
        new Box(1, 1)
      )
    );

    spawn();
  }
}

import { vec2 } from 'gl-matrix';
import { World, Settings, Box, Collider, Body, Circle } from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class GaussExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.5;
    this.settings.defaultPushFactor = 0.4;
    this.settings.defaultFriction = 0.3;

    this.createGauss();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createGauss() {
    const n = 512;
    let columns = 9;
    let band = 2.0;
    const colW = 0.25;
    const sinkSlope = Math.PI * 0.35;
    let obstacleBands = 10;
    let obstacleMarginX = 2.0;
    let obstacleMarginY = 0.75;
    let obstacleSize = 0.25;
    let ballR = 0.2;

    // floor
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(0.0, -10),
          0.0
        ),
        new Box(20, 1)
      )
    );

    // left wall
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(-10, -3.5),
          0.0
        ),
        new Box(0.5, 12)
      )
    );

    // right wall
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(10, -3.5),
          0.0
        ),
        new Box(0.5, 12)
      )
    );

    // columns
    let x = 0.0;
    while (columns--) {
      if (columns % 2 == 1) {
        x += band + 0.0;
      }
      this.world.addCollider(
        new Collider(
          this.world.createBody(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            vec2.fromValues(columns % 2 ? x : -x, -6.0),
            0.0
          ),
          new Box(colW, 7)
        )
      );
    }

    // sink
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(3, 10),
          sinkSlope
        ),
        new Box(10, 0.5)
      )
    );

    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(-3, 10),
          -sinkSlope
        ),
        new Box(10, 0.5)
      )
    );

    // obstacles
    let u = 0.0;
    let v = 5.0;

    for (let i = 0; i < obstacleBands; i++) {
      u = -i * obstacleMarginX * 0.5;

      for (let j = 0; j <= i; j++) {
        this.world.addCollider(
          new Collider(
            this.world.createBody(
              Number.POSITIVE_INFINITY,
              Number.POSITIVE_INFINITY,
              vec2.fromValues(u, v),
              Math.PI * 0.25
            ),
            new Box(obstacleSize, obstacleSize)
          )
        );

        u += obstacleMarginX;
      }

      v -= obstacleMarginY;
    }

    // balls
    const r = Math.floor(Math.sqrt(n));

    u = 0.0;
    v = 14.0;

    for (let i = r; i > 0; i--) {
      u = -i * ballR;

      for (let j = i; j >= 0; j--) {
        this.world.addCollider(
          new Collider(
            this.world.createBody(1.0, 1.0, vec2.fromValues(u, v), 0.0),
            new Circle(ballR)
          )
        );

        u += 2.0 * ballR;
      }

      v -= 2.0 * ballR;
    }
  }
}

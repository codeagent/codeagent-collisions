import { vec2 } from 'gl-matrix';
import { WorldInterface, Settings, Box, Circle } from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';

@Service()
export class GaussExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.constraintPushFactor = 0.4;

    this.createGauss();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createGauss(): void {
    const n = 512;
    let columns = 9;
    const band = 2.0;
    const colW = 0.25;
    const sinkSlope = Math.PI * 0.35;
    const obstacleBands = 10;
    const obstacleMarginX = 2.0;
    const obstacleMarginY = 0.75;
    const obstacleSize = 0.25;
    const ballR = 0.2;

    // floor
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(0.0, -10),
      }),
      shape: new Box(20, 1),
    });

    // left wall
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-10, -3.5),
      }),
      shape: new Box(0.5, 12),
    });

    // right wall
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(10, -3.5),
      }),
      shape: new Box(0.5, 12),
    });

    // columns
    let x = 0.0;
    while (columns--) {
      if (columns % 2 == 1) {
        x += band + 0.0;
      }
      this.world.addCollider({
        body: this.world.createBody({
          mass: Number.POSITIVE_INFINITY,
          inertia: Number.POSITIVE_INFINITY,
          position: vec2.fromValues(columns % 2 ? x : -x, -6.0),
        }),
        shape: new Box(colW, 7),
      });
    }

    // sink
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(3, 10),
        angle: sinkSlope,
      }),
      shape: new Box(10, 0.5),
    });

    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-3, 10),
        angle: -sinkSlope,
      }),
      shape: new Box(10, 0.5),
    });

    // obstacles
    let u = 0.0;
    let v = 5.0;

    for (let i = 0; i < obstacleBands; i++) {
      u = -i * obstacleMarginX * 0.5;

      for (let j = 0; j <= i; j++) {
        this.world.addCollider({
          body: this.world.createBody({
            mass: Number.POSITIVE_INFINITY,
            inertia: Number.POSITIVE_INFINITY,
            position: vec2.fromValues(u, v),
            angle: Math.PI * 0.25,
          }),
          shape: new Box(obstacleSize, obstacleSize),
        });

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
        this.world.addCollider({
          body: this.world.createBody({
            mass: 1.0,
            inertia: 1.0,
            position: vec2.fromValues(u, v),
          }),
          shape: new Circle(ballR),
        });

        u += 2.0 * ballR;
      }

      v -= 2.0 * ballR;
    }
  }
}

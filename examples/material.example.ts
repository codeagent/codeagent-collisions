import { vec2 } from 'gl-matrix';
import { Settings, Box, WorldInterface } from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';

@Service()
export class MaterialExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.constraintPushFactor = 0.7;

    this.createRestitutionObjects(3);
    this.createFrictionObjects(3);
    this.createAngularDampingObjects(3);
    this.createDampingObjects(3);
  }

  uninstall(): void {
    this.world.clear();
  }

  private createRestitutionObjects(n: number): void {
    // floor
    const floor = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: Number.POSITIVE_INFINITY,
      position: vec2.fromValues(0.0, -9),
    });

    this.world.addCollider({
      body: floor,
      shape: new Box(20, 0.1),
      material: { restitution: 1, friction: 0.5 },
    });

    let dr = 1.0 / n;
    let dx = 4.0;

    let x = -4;
    let restitution = 0.0;

    for (let i = 0; i < n; i++) {
      let box = this.world.createBody({
        mass: 1.0,
        inertia: 1.0,
        position: vec2.fromValues(x, 0),
      });

      this.world.addCollider({
        body: box,
        shape: new Box(1, 1),
        material: { restitution },
      });

      x += dx;
      restitution += dr;
    }
  }

  private createAngularDampingObjects(n: number): void {
    let dd = 1.0 / n;
    let dx = 4.0;

    let x = -4;
    let angularDamping = 0.0;

    for (let i = 0; i < n; i++) {
      let pivot = this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(x, 4),
      });

      let box = this.world.createBody({
        mass: 1.0,
        inertia: 1.0,
        position: vec2.fromValues(x, 4),
      });

      box.omega = Math.PI * 6;

      this.world.addCollider({
        body: box,
        shape: new Box(1, 1),
        material: { angularDamping },
      });

      this.world.addRevoluteJoint({ bodyA: pivot, bodyB: box });

      x += dx;
      angularDamping += dd;
    }
  }

  private createFrictionObjects(n: number): void {
    let df = -0.75 / n;
    let dy = -4.0;

    let y = 5;
    let friction = 0.75;

    for (let i = 0; i < n; i++) {
      let floor = this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-10.0, y),
        angle: Math.PI * -0.15,
      });

      this.world.addCollider({
        body: floor,
        shape: new Box(10, 0.1),
        material: { restitution: 0, friction: 0.0 },
      });

      let box = this.world.createBody({
        mass: 1.0,
        inertia: 1.0,
        position: vec2.fromValues(-14.0, y + 3),
        angle: Math.PI * -0.15,
      });

      this.world.addCollider({
        body: box,
        shape: new Box(1, 1),
        material: { friction },
      });

      y += dy;
      friction += df;
    }
  }

  private createDampingObjects(n: number): void {
    let dd = 6.0 / n;
    let dx = 4.0;

    let x = -4;
    let damping = 0.0;

    for (let i = 0; i < n; i++) {
      let box = this.world.createBody({
        mass: 1.0,
        inertia: 1.0,
        position: vec2.fromValues(x, 2),
      });

      this.world.addCollider({
        body: box,
        shape: new Box(1, 1),
        material: { damping },
      });

      x += dx;
      damping += dd;
    }
  }
}

import { vec2 } from 'gl-matrix';
import { WorldInterface, Settings, Box, Capsule, Circle } from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';

@Service()
export class StackExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.15;
    this.settings.defaultPushFactor = 0.15;
    this.settings.defaultFriction = 0.95;

    this.createStacks();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createStacks() {
    // floor
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(0.0, -9),
      }),
      shape: new Box(26, 1),
    });

    // left wall
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(-14, 0),
      }),
      shape: new Box(1, 16),
    });

    // right wall
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(14, 0),
      }),
      shape: new Box(1, 16),
    });

    const box = new Box(1, 1);
    const girder = new Box(3, 1);
    const capsule = new Capsule(0.5, 3);
    const circle = new Circle(0.5);
    const mass = 1.0;
    let i = 0;

    // boxes
    for (let y = -8.0; y <= 8; y += 1.0) {
      this.world.addCollider({
        body: this.world.createBody({
          mass: mass,
          inertia: box.inetria(mass),
          position: vec2.fromValues(-12, y),
        }),
        shape: box,
      });
    }

    // box/girder
    for (let y = -8.0; y <= 9; y += 1.0) {
      if (i % 2 === 0) {
        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: box.inetria(mass),
            position: vec2.fromValues(-9.5, y),
            angle: 0,
          }),
          shape: box,
        });

        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: box.inetria(mass),
            position: vec2.fromValues(-6.5, y),
            angle: 0,
          }),
          shape: box,
        });
      } else {
        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: girder.inetria(mass),
            position: vec2.fromValues(-8, y),
            angle: 0,
          }),
          shape: girder,
        });
      }

      i++;
    }

    // circle/girder
    for (let y = -8.0; y <= 9; y += 1.0) {
      if (i % 2 === 0) {
        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: mass * 20,
            position: vec2.fromValues(-5, y),
            angle: 0,
          }),
          shape: circle,
        });

        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: mass * 20,
            position: vec2.fromValues(-3, y),
            angle: 0,
          }),
          shape: circle,
        });
      } else {
        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: mass * 20,
            position: vec2.fromValues(-4, y),
            angle: 0,
          }),
          shape: girder,
        });
      }

      i++;
    }

    // box/capsule
    for (let y = -8.0; y <= 8; y += 1.0) {
      if (i % 2 === 0) {
        this.world.addCollider({
          body: this.world.createBody({
            mass: 1.0,
            inertia: 2.0,
            position: vec2.fromValues(-1.0, y),
            angle: 0,
          }),
          shape: box,
        });

        this.world.addCollider({
          body: this.world.createBody({
            mass: 1.0,
            inertia: 2.0,
            position: vec2.fromValues(1.0, y),
            angle: 0,
          }),
          shape: box,
        });
      } else {
        this.world.addCollider({
          body: this.world.createBody({
            mass: 1.0,
            inertia: 2.0,
            position: vec2.fromValues(0, y),
            angle: Math.PI * 0.5,
          }),
          shape: capsule,
        });
      }

      i++;
    }

    // circles
    for (let y = -8.0; y <= 8; y += 1.0) {
      this.world.addCollider({
        body: this.world.createBody({
          mass: mass,
          inertia: circle.inetria(mass) * 4,
          position: vec2.fromValues(3, y),
        }),
        shape: circle,
      });
    }

    // capsules
    for (let y = -8.0; y <= 8; y += 1.0) {
      this.world.addCollider({
        body: this.world.createBody({
          mass: mass,
          inertia: mass * 2,
          position: vec2.fromValues(6, y),
          angle: Math.PI * 0.5,
        }),
        shape: capsule,
      });
    }

    //capsule/circle
    for (let y = -8.0; y <= 2; y += 1.0) {
      if (i % 2 === 0) {
        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: mass * 20,
            position: vec2.fromValues(10.0, y),
            angle: 0,
          }),
          shape: circle,
        });

        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: mass * 20,
            position: vec2.fromValues(12.0, y),
            angle: 0,
          }),
          shape: circle,
        });
      } else {
        this.world.addCollider({
          body: this.world.createBody({
            mass: mass,
            inertia: mass * 1,
            position: vec2.fromValues(11, y),
            angle: Math.PI * 0.5,
          }),
          shape: capsule,
        });
      }

      i++;
    }
  }
}

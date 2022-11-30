import { vec2 } from 'gl-matrix';
import { World, Settings, Box, Collider, Capsule, Circle } from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class StackExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.15;
    this.settings.defaultPushFactor = 0.15;
    this.settings.defaultFriction = 0.95;

    this.createStacks();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createStacks() {
    // floor
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(0.0, -9),
          0.0
        ),
        new Box(26, 1)
      )
    );

    // left wall
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(-14, 0),
          0.0
        ),
        new Box(1, 16)
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
        new Box(1, 16)
      )
    );

    let box = new Box(1, 1);
    let girder = new Box(3, 1);
    let capsule = new Capsule(0.5, 3);
    let circle = new Circle(0.5);
    let mass = 1.0;
    let i = 0;

    // boxes
    for (let y = -8.0; y <= 8; y += 1.0) {
      this.world.addCollider(
        new Collider(
          this.world.createBody(
            mass,
            box.inetria(mass),
            vec2.fromValues(-12, y),
            0.0
          ),
          box
        )
      );
    }

    // box/girder
    for (let y = -8.0; y <= 9; y += 1.0) {
      if (i % 2 === 0) {
        this.world.addCollider(
          new Collider(
            this.world.createBody(
              mass,
              box.inetria(mass),
              vec2.fromValues(-9.5, y),
              0
            ),
            box
          )
        );

        this.world.addCollider(
          new Collider(
            this.world.createBody(
              mass,
              box.inetria(mass),
              vec2.fromValues(-6.5, y),
              0
            ),
            box
          )
        );
      } else {
        this.world.addCollider(
          new Collider(
            this.world.createBody(
              mass,
              girder.inetria(mass),
              vec2.fromValues(-8, y),
              0
            ),
            girder
          )
        );
      }

      i++;
    }

    // circle/girder
    for (let y = -8.0; y <= 9; y += 1.0) {
      if (i % 2 === 0) {
        this.world.addCollider(
          new Collider(
            this.world.createBody(mass, mass * 20, vec2.fromValues(-5, y), 0),
            circle
          )
        );

        this.world.addCollider(
          new Collider(
            this.world.createBody(mass, mass * 20, vec2.fromValues(-3, y), 0),
            circle
          )
        );
      } else {
        this.world.addCollider(
          new Collider(
            this.world.createBody(mass, mass * 20, vec2.fromValues(-4, y), 0),
            girder
          )
        );
      }

      i++;
    }

    // box/capsule
    for (let y = -8.0; y <= 8; y += 1.0) {
      if (i % 2 === 0) {
        this.world.addCollider(
          new Collider(
            this.world.createBody(1.0, 2.0, vec2.fromValues(-1.0, y), 0),
            box
          )
        );

        this.world.addCollider(
          new Collider(
            this.world.createBody(1.0, 2.0, vec2.fromValues(1.0, y), 0),
            box
          )
        );
      } else {
        this.world.addCollider(
          new Collider(
            this.world.createBody(
              1.0,
              2.0,
              vec2.fromValues(0, y),
              Math.PI * 0.5
            ),
            capsule
          )
        );
      }

      i++;
    }

    // circles
    for (let y = -8.0; y <= 8; y += 1.0) {
      this.world.addCollider(
        new Collider(
          this.world.createBody(
            mass,
            circle.inetria(mass) * 4,
            vec2.fromValues(3, y),
            0.0
          ),
          circle
        )
      );
    }

    // capsules
    for (let y = -8.0; y <= 8; y += 1.0) {
      this.world.addCollider(
        new Collider(
          this.world.createBody(
            mass,
            mass * 2,
            vec2.fromValues(6, y),
            Math.PI * 0.5
          ),
          capsule
        )
      );
    }

    //capsule/circle
    for (let y = -8.0; y <= 2; y += 1.0) {
      if (i % 2 === 0) {
        this.world.addCollider(
          new Collider(
            this.world.createBody(mass, mass * 20, vec2.fromValues(10.0, y), 0),
            circle
          )
        );

        this.world.addCollider(
          new Collider(
            this.world.createBody(mass, mass * 20, vec2.fromValues(12.0, y), 0),
            circle
          )
        );
      } else {
        this.world.addCollider(
          new Collider(
            this.world.createBody(
              mass,
              mass * 1,
              vec2.fromValues(11, y),
              Math.PI * 0.5
            ),
            capsule
          )
        );
      }

      i++;
    }
  }
}

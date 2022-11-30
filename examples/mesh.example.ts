import { vec2 } from 'gl-matrix';
import {
  World,
  Settings,
  Box,
  Collider,
  MeshShape,
  Circle,
  loadObj,
} from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';
import MESH from './objects/mesh.obj';

@Service()
export class MeshExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.25;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.75;

    this.createMesh();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createMesh() {
    this.world.addCollider(
      new Collider(
        this.world.createBody(10, 1, vec2.fromValues(0.0, 6.5), Math.PI * 0.25),
        new Circle(0.5)
      )
    );

    const collection = loadObj(MESH);

    for (const object in collection) {
      this.world.addCollider(
        new Collider(
          this.world.createBody(10, 100, vec2.fromValues(0, 0), 0),
          new MeshShape(collection[object])
        )
      );
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
  }
}

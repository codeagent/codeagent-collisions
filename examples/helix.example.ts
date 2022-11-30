import { vec2 } from 'gl-matrix';
import {
  World,
  Settings,
  Collider,
  loadObj,
  Circle,
  MeshShape,
} from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';
import HELIX from './objects/helix.obj';

@Service()
export class HelixExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.25;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.75;

    this.createHelix();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createHelix() {
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          10,
          1.0,
          vec2.fromValues(0.0, 0.5),
          Math.PI * 0.25
        ),
        new Circle(0.5)
      )
    );

    const collection = loadObj(HELIX);

    for (const object in collection) {
      this.world.addCollider(
        new Collider(
          this.world.createBody(
            Number.POSITIVE_INFINITY,
            10,
            vec2.fromValues(0, 0),
            0
          ),
          new MeshShape(collection[object])
        )
      );
    }
  }
}

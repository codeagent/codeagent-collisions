import { vec2 } from 'gl-matrix';
import {
  World,
  Settings,
  Collider,
  Circle,
  loadObj,
  MeshShape,
} from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';
import PINTBALL from './objects/pintball.obj';

@Service()
export class PinballExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.75;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.75;

    this.createPinball();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createPinball() {
    this.world.addCollider(
      new Collider(
        this.world.createBody(10, 1, vec2.fromValues(0.0, 6.5), Math.PI * 0.25),
        new Circle(0.25)
      )
    );

    const collection = loadObj(PINTBALL);

    for (const object in collection) {
      this.world.addCollider(
        new Collider(
          this.world.createBody(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            vec2.fromValues(0, 0),
            0
          ),
          new MeshShape(collection[object])
        )
      );
    }
  }
}

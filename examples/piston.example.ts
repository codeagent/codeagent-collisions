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
import PISTON from './objects/piston.obj';

@Service()
export class PistonExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.25;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.75;

    this.createPiston();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createPiston() {
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          1,
          0.1,
          vec2.fromValues(0.0, 10.0),
          Math.PI * 0.25
        ),
        new Circle(1.5)
      )
    );

    const collection = loadObj(PISTON);

    const cylinder = this.world.createBody(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(0, 0),
      0
    );
    this.world.addCollider(
      new Collider(cylinder, new MeshShape(collection['cylinder']))
    );

    const piston = this.world.createBody(1, 1, vec2.fromValues(0, -1), 0);
    this.world.addCollider(
      new Collider(piston, new MeshShape(collection['piston']))
    );

    this.world.addPrismaticJoint(
      cylinder,
      vec2.create(),
      piston,
      vec2.create(),
      vec2.fromValues(0.0, 1.0),
      0,
      0.05,
      4
    );

    this.world.addSpring(
      cylinder,
      vec2.create(),
      piston,
      vec2.create(),
      1.0,
      1000.0,
      10.0
    );
  }
}

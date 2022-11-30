import { vec2 } from 'gl-matrix';
import { World, Settings, Collider, loadObj, MeshShape } from 'js-physics-2d';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';
import GEARS from './objects/gears.obj';

@Service()
export class GearsExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.25;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultPushFactor = 0.45;

    this.createGears();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createGears() {
    const collection = loadObj(GEARS);

    // for (const object in collection) {
    const motor = this.world.createBody(
      Number.POSITIVE_INFINITY,
      10,
      vec2.fromValues(0, 0),
      0
    );
    this.world.addMotor(motor, 15.0, 5.0);
    this.world.addCollider(
      new Collider(motor, new MeshShape(collection['gear_o_049']))
    );

    const gear0 = this.world.createBody(
      Number.POSITIVE_INFINITY,
      10,
      vec2.fromValues(-6.4191, 0),
      0
    );
    this.world.addCollider(
      new Collider(gear0, new MeshShape(collection['gear_051']))
    );

    const gear1 = this.world.createBody(
      Number.POSITIVE_INFINITY,
      10,
      vec2.fromValues(-0.8335, 9.7032),
      0
    );
    this.world.addCollider(
      new Collider(gear1, new MeshShape(collection['gear_052']))
    );

    const gear2 = this.world.createBody(
      Number.POSITIVE_INFINITY,
      10,
      vec2.fromValues(6.3478, 6.1935),
      0
    );
    this.world.addCollider(
      new Collider(gear2, new MeshShape(collection['gear_049']))
    );

    const gear3 = this.world.createBody(
      Number.POSITIVE_INFINITY,
      10,
      vec2.fromValues(9.0431, -1.3321),
      0
    );

    this.world.addCollider(
      new Collider(gear3, new MeshShape(collection['gear_o_052']))
    );

    const gear4 = this.world.createBody(
      Number.POSITIVE_INFINITY,
      10,
      vec2.fromValues(1.7793, -7.6031),
      0
    );

    this.world.addCollider(
      new Collider(gear4, new MeshShape(collection['gear_o_050']))
    );
  }
}

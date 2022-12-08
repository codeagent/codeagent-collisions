import {
  World,
  Settings,
  Box,
  Collider,
  Body,
  Circle,
  Capsule,
} from 'js-physics-2d';
import { vec2 } from 'gl-matrix';
import { Inject, Service } from 'typedi';
import { ExampleInterface } from './example.interface';

@Service()
export class JointExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    private readonly world: World
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.35;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.05;
    // this.settings.defaultDamping = 1.0;
    // this.settings.defaultAngularDamping = 1.0;
    this.settings.solverPositionIterations = 10;
    this.settings.solverVelocityIterations = 10;

    this.createJoints();
  }

  uninstall(): void {
    this.world.dispose();
  }

  private createJoints() {
    this.createRevoluteJoint();
    this.createDistanceJoint();
    this.createWeldJoint();
    this.createPrismaticJoint();
    this.createSprings();

    // floor
    this.world.addCollider(
      new Collider(
        this.world.createBody(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          vec2.fromValues(0.0, -9),
          0.0
        ),
        new Box(30, 0.25)
      )
    );
  }

  private createRevoluteJoint() {
    // Revolute joint
    const hinge = this.world.createBody(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(-9, 2),
      0
    );

    const mass = 1.0;
    const capsuleShape = new Capsule(0.5, 4.0);

    const capsule0 = this.world.createBody(
      mass,
      capsuleShape.inetria(mass),
      vec2.fromValues(-1, -7),
      Math.PI * 0.5
    );
    this.world.addCollider(new Collider(capsule0, capsuleShape, 0x01));

    const capsule1 = this.world.createBody(
      mass,
      capsuleShape.inetria(mass),
      vec2.fromValues(1, -7),
      Math.PI * 0.5
    );
    this.world.addCollider(new Collider(capsule1, capsuleShape, 0x02));

    this.world.addRevoluteJoint(
      hinge,
      vec2.fromValues(0, 0),
      capsule0,
      vec2.fromValues(0, 2)
    );

    this.world.addRevoluteJoint(
      capsule0,
      vec2.fromValues(0, -2),
      capsule1,
      vec2.fromValues(0, 2)
    );
  }

  private createDistanceJoint() {
    // Revolute joint
    const hinge = this.world.createBody(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(-5, 2),
      0
    );

    const mass = 1.0;
    const boxShape = new Box(1.0, 1.0);

    const box0 = this.world.createBody(
      1.0,
      boxShape.inetria(mass),
      vec2.fromValues(-5, -2),
      0
    );
    this.world.addCollider(new Collider(box0, boxShape, 0x01));

    const box1 = this.world.createBody(
      mass,
      boxShape.inetria(mass),
      vec2.fromValues(-5, -5),
      0
    );
    this.world.addCollider(new Collider(box1, boxShape, 0x02));

    this.world.addDistanceJoint(
      hinge,
      vec2.fromValues(0, 0),
      box0,
      vec2.fromValues(0.5, 0.5),
      3.0
    );

    this.world.addDistanceJoint(
      box0,
      vec2.fromValues(-0.5, -0.5),
      box1,
      vec2.fromValues(0.5, 0.5),
      3.0
    );
  }

  private createWeldJoint() {
    // Revolute joint
    const hinge = this.world.createBody(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(0, 2),
      0
    );

    const mass = 1.0;
    const capsuleShape = new Capsule(0.5, 4.0);

    const capsule0 = this.world.createBody(
      mass,
      capsuleShape.inetria(mass),
      vec2.fromValues(-1, -7),
      Math.PI * 0.5
    );
    this.world.addCollider(new Collider(capsule0, capsuleShape, 0x01));

    const capsule1 = this.world.createBody(
      mass,
      capsuleShape.inetria(mass),
      vec2.fromValues(1, -7),
      0
    );
    this.world.addCollider(new Collider(capsule1, capsuleShape, 0x02));

    const capsule2 = this.world.createBody(
      mass,
      capsuleShape.inetria(mass),
      vec2.fromValues(1, -7),
      Math.PI * 0.5
    );
    this.world.addCollider(new Collider(capsule2, capsuleShape, 0x00));

    this.world.addRevoluteJoint(
      hinge,
      vec2.fromValues(0, 0),
      capsule0,
      vec2.fromValues(0, 2)
    );

    this.world.addWeldJoint(
      capsule0,
      vec2.fromValues(0, -1.5),
      capsule1,
      vec2.fromValues(0, -1.5)
    );

    this.world.addWeldJoint(
      capsule1,
      vec2.fromValues(0, 1.5),
      capsule2,
      vec2.fromValues(0, 1.5)
    );
  }

  private createPrismaticJoint() {
    // Revolute joint

    const mass = 1.0;
    const boxShape = new Box(1.0, 1.0);
    const rectShape = new Box(1.0, 0.25);

    const box0 = this.world.createBody(
      Number.POSITIVE_INFINITY,
      boxShape.inetria(mass),
      vec2.fromValues(5, 2),
      0
    );
    this.world.addCollider(new Collider(box0, boxShape, 0x01));

    const box1 = this.world.createBody(
      mass,
      boxShape.inetria(mass),
      vec2.fromValues(4, 2),
      0
    );
    this.world.addCollider(new Collider(box1, rectShape, 0x02));

    const box2 = this.world.createBody(
      mass,
      boxShape.inetria(mass),
      vec2.fromValues(6, 2),
      0
    );
    this.world.addCollider(new Collider(box2, rectShape, 0x02));
    this.world.addMotor(box0, 1.0, 50.0);

    this.world.addPrismaticJoint(
      box0,
      vec2.fromValues(-0.5, 0),
      box1,
      vec2.fromValues(0.0, 0.0),
      vec2.fromValues(1.0, 0.0),
      0.0,
      1.0,
      3.0
    );

    this.world.addPrismaticJoint(
      box0,
      vec2.fromValues(0.5, 0),
      box2,
      vec2.fromValues(0.0, 0.0),
      vec2.fromValues(1.0, 0.0),
      0.0,
      1.0,
      3.0
    );
  }

  private createSprings() {
    // Revolute joint
    const hinge = this.world.createBody(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      vec2.fromValues(10, 2),
      0
    );

    const mass = 1.0;
    const stiffness = 45.0;
    const extinction = 1;
    const circleShape = new Circle(0.5);

    const circle0 = this.world.createBody(
      1.0,
      circleShape.inetria(mass),
      vec2.fromValues(10, -2),
      0
    );
    this.world.addCollider(new Collider(circle0, circleShape, 0x01));

    const circle1 = this.world.createBody(
      mass,
      circleShape.inetria(mass),
      vec2.fromValues(10, -5),
      0
    );
    this.world.addCollider(new Collider(circle1, circleShape, 0x02));

    this.world.addSpring(
      hinge,
      vec2.fromValues(0, 0),
      circle0,
      vec2.fromValues(0, 0),
      3.0,
      stiffness,
      extinction
    );

    this.world.addSpring(
      circle0,
      vec2.fromValues(0, 0),
      circle1,
      vec2.fromValues(0, 0),
      3.0,
      stiffness,
      extinction
    );
  }
}

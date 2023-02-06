import { vec2 } from 'gl-matrix';
import { WorldInterface, Settings, Box, Circle, Capsule } from 'rb-phys2d';
import { Inject, Service } from 'typedi';

import { ExampleInterface } from './example.interface';

@Service()
export class JointExample implements ExampleInterface {
  constructor(
    @Inject('SETTINGS') private readonly settings: Settings,
    @Inject('WORLD') private readonly world: WorldInterface
  ) {}

  install(): void {
    this.settings.defaultRestitution = 0.35;
    this.settings.defaultPushFactor = 0.65;
    this.settings.defaultFriction = 0.05;

    this.createJoints();
  }

  uninstall(): void {
    this.world.clear();
  }

  private createJoints() {
    this.createRevoluteJoint();
    this.createDistanceJoint();
    this.createWeldJoint();
    this.createPrismaticJoint();
    this.createSprings();
    this.createFreeBody();
    this.createWheels(2, 2);

    // floor
    this.world.addCollider({
      body: this.world.createBody({
        mass: Number.POSITIVE_INFINITY,
        inertia: Number.POSITIVE_INFINITY,
        position: vec2.fromValues(0.0, -9),
        angle: 0.0,
      }),
      shape: new Box(30, 0.25),
    });
  }

  private createRevoluteJoint() {
    // Revolute joint
    const hinge = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: Number.POSITIVE_INFINITY,
      position: vec2.fromValues(-9, 2),
      angle: 0,
    });

    const mass = 1.0;
    const capsuleShape = new Capsule(0.5, 4.0);

    const capsule0 = this.world.createBody({
      mass: mass,
      inertia: capsuleShape.inetria(mass),
      position: vec2.fromValues(-1, -7),
      angle: 0,
    });
    this.world.addCollider({ body: capsule0, shape: capsuleShape, mask: 0x01 });

    const capsule1 = this.world.createBody({
      mass: mass,
      inertia: capsuleShape.inetria(mass),
      position: vec2.fromValues(1, -7),
      angle: 0,
    });
    this.world.addCollider({ body: capsule1, shape: capsuleShape, mask: 0x02 });

    this.world.addRevoluteJoint({
      bodyA: hinge,
      bodyB: capsule0,
      pivotB: vec2.fromValues(0, 2),
      minAngle: -Math.PI * 0.5,
      maxAngle: Math.PI * 0.5,
    });

    this.world.addRevoluteJoint({
      bodyA: capsule0,
      pivotA: vec2.fromValues(0, -2),
      bodyB: capsule1,
      pivotB: vec2.fromValues(0, 2),
      minAngle: Math.PI * -0.25,
      maxAngle: Math.PI * 0.25,
      stiffness: 1000,
      damping: 10,
    });
  }

  private createDistanceJoint() {
    // Revolute joint
    const hinge = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: Number.POSITIVE_INFINITY,
      position: vec2.fromValues(-5, 2),
      angle: 0,
    });

    const mass = 1.0;
    const boxShape = new Box(1.0, 1.0);

    const box0 = this.world.createBody({
      mass: 1.0,
      inertia: boxShape.inetria(mass),
      position: vec2.fromValues(-5, -2),
      angle: 0,
    });
    this.world.addCollider({ body: box0, shape: boxShape, mask: 0x0 });

    const box1 = this.world.createBody({
      mass: mass,
      inertia: boxShape.inetria(mass),
      position: vec2.fromValues(-5, -5),
      angle: 0,
    });
    this.world.addCollider({ body: box1, shape: boxShape, mask: 0x0 });

    this.world.addDistanceJoint({
      bodyA: hinge,
      bodyB: box0,
      pivotA: vec2.fromValues(0, 0),
      pivotB: vec2.fromValues(0.5, 0.5),
      distance: 3.0,
    });

    this.world.addDistanceJoint({
      bodyA: box0,
      bodyB: box1,
      pivotA: vec2.fromValues(-0.5, -0.5),
      pivotB: vec2.fromValues(0.5, 0.5),
      distance: 3.0,
    });
  }

  private createWeldJoint() {
    // Revolute joint
    const hinge = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: Number.POSITIVE_INFINITY,
      position: vec2.fromValues(0, 2),
      angle: 0,
    });

    const mass = 1.0;
    const capsuleShape = new Capsule(0.5, 4.0);

    const capsule0 = this.world.createBody({
      mass: mass,
      inertia: capsuleShape.inetria(mass),
      position: vec2.fromValues(-1, -7),
      angle: Math.PI * 0.5,
    });
    this.world.addCollider({ body: capsule0, shape: capsuleShape, mask: 0x01 });

    const capsule1 = this.world.createBody({
      mass: mass,
      inertia: capsuleShape.inetria(mass),
      position: vec2.fromValues(1, -7),
      angle: 0,
    });
    this.world.addCollider({ body: capsule1, shape: capsuleShape, mask: 0x02 });

    const capsule2 = this.world.createBody({
      mass: mass,
      inertia: capsuleShape.inetria(mass),
      position: vec2.fromValues(1, -7),
      angle: Math.PI * 0.5,
    });
    this.world.addCollider({ body: capsule2, shape: capsuleShape, mask: 0x00 });

    this.world.addRevoluteJoint({
      bodyA: hinge,
      bodyB: capsule0,
      pivotB: vec2.fromValues(0, 2),
    });

    this.world.addWeldJoint({
      bodyA: capsule0,
      pivotA: vec2.fromValues(0, -1.5),
      bodyB: capsule1,
      pivotB: vec2.fromValues(0, -1.5),
    });

    this.world.addWeldJoint({
      bodyA: capsule1,
      pivotA: vec2.fromValues(0, 1.5),
      bodyB: capsule2,
      pivotB: vec2.fromValues(0, 1.5),
    });
  }

  private createPrismaticJoint() {
    // Revolute joint

    const mass = 1.0;
    const boxShape = new Box(1.0, 1.0);
    const rectShape = new Box(1.0, 0.25);

    const box0 = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: boxShape.inetria(mass),
      position: vec2.fromValues(5, 2),
      angle: 0,
    });
    this.world.addCollider({ body: box0, shape: boxShape, mask: 0x01 });

    const box1 = this.world.createBody({
      mass: mass,
      inertia: boxShape.inetria(mass),
      position: vec2.fromValues(4, 2),
      angle: 0,
    });
    this.world.addCollider({ body: box1, shape: rectShape, mask: 0x02 });

    const box2 = this.world.createBody({
      mass: mass,
      inertia: boxShape.inetria(mass),
      position: vec2.fromValues(6, 2),
      angle: 0,
    });
    this.world.addCollider({ body: box2, shape: rectShape, mask: 0x02 });
    this.world.addMotor({ body: box0, speed: 1.0, torque: 50.0 });

    this.world.addPrismaticJoint({
      bodyA: box0,
      pivotA: vec2.fromValues(-0.5, 0),
      localAxis: vec2.fromValues(-1.0, 0.0),
      bodyB: box1,
      minDistance: 0.5,
      maxDistance: 3.0,
    });

    this.world.addPrismaticJoint({
      bodyA: box0,
      pivotA: vec2.fromValues(0.5, 0),
      bodyB: box2,
      minDistance: 1.0,
      maxDistance: 3.0,
    });
  }

  private createSprings() {
    // Revolute joint
    const hinge = this.world.createBody({
      mass: Number.POSITIVE_INFINITY,
      inertia: Number.POSITIVE_INFINITY,
      position: vec2.fromValues(10, 2),
      angle: 0,
    });

    const mass = 1.0;
    const stiffness = 45.0;
    const extinction = 1;
    const circleShape = new Circle(0.5);

    const circle0 = this.world.createBody({
      mass: 1.0,
      inertia: circleShape.inetria(mass),
      position: vec2.fromValues(10, -2),
      angle: 0,
    });
    this.world.addCollider({ body: circle0, shape: circleShape, mask: 0x01 });

    const circle1 = this.world.createBody({
      mass: mass,
      inertia: circleShape.inetria(mass),
      position: vec2.fromValues(10, -5),
      angle: 0,
    });
    this.world.addCollider({ body: circle1, shape: circleShape, mask: 0x02 });

    this.world.addSpring({
      bodyA: hinge,
      bodyB: circle0,
      distance: 3.0,
      stiffness,
      extinction,
    });

    this.world.addSpring({
      bodyA: circle0,
      bodyB: circle1,
      distance: 3,
      stiffness,
      extinction,
    });
  }

  private createFreeBody() {
    const mass = 1.0;
    const boxShape = new Box(1.0, 1.0);

    const box = this.world.createBody({
      mass: 1.0,
      inertia: boxShape.inetria(mass),
      position: vec2.fromValues(-12, -6),
      angle: Math.PI * 0.125,
    });
    this.world.addCollider({ body: box, shape: boxShape });
  }

  private createWheels(wheels: number, length: number) {
    const stiffness = 25;
    const extinction = 1;
    const position = vec2.fromValues(6.0, -6.0);

    const hull = this.world.createBody({
      mass: 1.0,
      inertia: 1.0,
      position,
      angle: 0,
    });
    this.world.addCollider({ body: hull, shape: new Box(length, 1.0) });

    for (let i = 0; i < wheels; i++) {
      const wheel = this.world.createBody({
        mass: 1.0,
        inertia: 1.0,
        angle: 0.0,
        position: vec2.fromValues(position[0], position[1] - 2),
      });
      this.world.addCollider({ body: wheel, shape: new Circle(0.5) });

      this.world.addWheelJonit({
        bodyA: hull,
        pivotA: vec2.fromValues(
          (length / (wheels - 1)) * i - length * 0.5,
          -0.5
        ),
        bodyB: wheel,
        localAxis: vec2.fromValues(0.0, -1.0),
        minDistance: 0.75,
        maxDistance: 3,
      });

      this.world.addSpring({
        bodyA: hull,
        pivotA: vec2.fromValues(
          (length / (wheels - 1)) * i - length * 0.5,
          -0.5
        ),
        bodyB: wheel,
        distance: 2,
        stiffness,
        extinction,
      });
    }
  }
}

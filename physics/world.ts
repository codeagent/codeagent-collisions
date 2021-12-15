import { vec2 } from 'gl-matrix';

import { Body } from './body';
import {
  ConstraintInterface,
  AngularMotorConstraint,
  MouseXConstraint,
  MouseYConstraint,
} from './constraint';
import { CollisionDetector } from './detector';
import { Shape, TestTarget, AABBBounded, MeshShape } from './collision';
import { releaseId, uniqueId } from './unique-id';
import {
  ContactJoint,
  DistanceJoint,
  JointInterface,
  PrismaticJoint,
  RevoluteJoint,
  SpringJoint,
  WeldJoint,
} from './joint';
import { WheelJoint } from './joint/wheel-joint';
import { IslandsGenerator } from './islands-generator';
import { Profiler } from './profiler';
import { MouseControlInterface } from './mouse-control.interface';

export type BodyShape = (Shape & TestTarget & AABBBounded) | MeshShape;

export class World {
  public readonly bodies: Body[] = [];
  public readonly bodyShape = new Map<Body, BodyShape>();
  public readonly bodyJoints = new Map<Body, Set<JointInterface>>();
  public readonly bodyContacts = new Map<Body, Set<JointInterface>>();
  public readonly bodyConstraints = new Map<Body, Set<ConstraintInterface>>();
  public readonly bodyIndex = new Map<Body, number>();
  public readonly bodyIsland = new Map<Body, number>();
  public readonly collisionDetector: CollisionDetector;
  private readonly islandsGenerator: IslandsGenerator;
  private readonly profiler = Profiler.instance;

  // "read"/"write" variables
  public positions = new Float32Array(0);
  public velocities = new Float32Array(0);
  public forces = new Float32Array(0);
  public invMasses = new Float32Array(0);

  constructor(
    public gravity = vec2.fromValues(0.0, -9.8),
    public pushFactor = 0.6,
    public iterations = 50,
    public friction = 0.5,
    public restitution = 0.5
  ) {
    this.islandsGenerator = new IslandsGenerator(this);
    this.collisionDetector = new CollisionDetector(this);
  }

  createBody(
    shape: BodyShape,
    mass: number,
    intertia: number,
    position: vec2,
    angle: number
  ) {
    const bodyId = this.bodies.length;
    const body = new Body(uniqueId(), bodyId);
    body.mass = mass;
    body.inertia = intertia;
    body.position = position;
    body.angle = angle;

    this.bodies.push(body);
    this.bodyShape.set(body, shape);
    this.bodyContacts.set(body, new Set<JointInterface>());
    this.bodyJoints.set(body, new Set<JointInterface>());
    this.bodyConstraints.set(body, new Set<ConstraintInterface>());
    this.bodyIndex.set(body, bodyId);

    body.updateTransform();

    this.collisionDetector.registerBody(body);
    this.islandsGenerator.resizeIsland(this.bodies.length);

    return body;
  }

  destroyBody(body: Body) {
    const bodyIndex = this.bodies.indexOf(body);
    if (bodyIndex === -1) {
      return;
    }
    this.bodies.splice(bodyIndex, 1);
    releaseId(body.id);

    this.bodyContacts.delete(body);
    this.bodyJoints.delete(body);
    this.bodyConstraints.delete(body);
    this.bodyShape.delete(body);
    this.bodyIndex.delete(body);

    this.islandsGenerator.resizeIsland(this.bodies.length);
  }

  simulate(dt: number) {
    this.detectCollisions();
    this.integrate(dt);
    this.updateBodiesTransforms();
  }

  addDistanceJoint(
    bodyA: Body,
    positionA: vec2,
    bodyB: Body,
    positionB: vec2,
    distance: number
  ) {
    const joint = new DistanceJoint(
      this,
      bodyA,
      positionA,
      bodyB,
      positionB,
      distance
    );
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    return joint;
  }

  addPrismaticJoint(
    bodyA: Body,
    jointA: vec2,
    bodyB: Body,
    jointB: vec2,
    localAxis: vec2,
    refAngle = 0,
    minDistance = 0,
    maxDistance = Number.POSITIVE_INFINITY
  ) {
    const joint = new PrismaticJoint(
      this,
      bodyA,
      jointA,
      bodyB,
      jointB,
      localAxis,
      refAngle,
      minDistance,
      maxDistance
    );
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    return joint;
  }

  addRevoluteJoint(bodyA: Body, jointA: vec2, bodyB: Body, jointB: vec2) {
    const joint = new RevoluteJoint(this, bodyA, jointA, bodyB, jointB);
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    return joint;
  }

  addWeldJoint(
    bodyA: Body,
    jointA: vec2,
    bodyB: Body,
    jointB: vec2,
    refAngle = 0
  ) {
    const joint = new WeldJoint(this, bodyA, jointA, bodyB, jointB, refAngle);
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    return joint;
  }

  addMotor(body: Body, speed: number, torque: number) {
    const motor = new AngularMotorConstraint(this, body, speed, torque);
    this.bodyConstraints.get(body).add(motor);
    return motor;
  }

  addWheelJonit(
    bodyA: Body,
    jointA: vec2,
    bodyB: Body,
    jointB: vec2,
    localAxis: vec2,
    minDistance = 0,
    maxDistance = Number.POSITIVE_INFINITY
  ) {
    const joint = new WheelJoint(
      this,
      bodyA,
      jointA,
      bodyB,
      jointB,
      localAxis,
      minDistance,
      maxDistance
    );
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    return joint;
  }

  addSpring(
    bodyA: Body,
    positionA: vec2,
    bodyB: Body,
    positionB: vec2,
    distance: number,
    stiffness: number,
    extinction: number
  ) {
    const joint = new SpringJoint(
      this,
      bodyA,
      positionA,
      bodyB,
      positionB,
      distance,
      stiffness,
      extinction
    );
    this.bodyJoints.get(bodyA).add(joint);
    this.bodyJoints.get(bodyB).add(joint);
    return joint;
  }

  addMouseConstraints(
    control: MouseControlInterface,
    body: Body,
    joint: vec2,
    stiffness: number,
    maxForce: number
  ) {
    const constraintX = new MouseXConstraint(
      this,
      body,
      joint,
      control,
      stiffness,
      maxForce
    );
    this.bodyConstraints.get(body).add(constraintX);
    const constraintY = new MouseYConstraint(
      this,
      body,
      joint,
      control,
      stiffness,
      maxForce
    );
    this.bodyConstraints.get(body).add(constraintY);
    return [constraintX, constraintY];
  }

  removeConstraint(constraint: ConstraintInterface) {
    for (const [, constraints] of this.bodyConstraints) {
      if (constraints.has(constraint)) {
        constraints.delete(constraint);
        break;
      }
    }
  }

  removeJoint(joint: JointInterface) {
    this.bodyJoints.get(joint.bodyA).delete(joint);
    this.bodyJoints.get(joint.bodyB).delete(joint);
  }

  private integrate(dt: number) {
    this.profiler.begin('World.integrate');

    let islandId = 0;
    this.bodyIsland.clear();
    for (const island of this.islandsGenerator.generateIslands()) {
      island.integrate(dt);
      island.bodies.forEach((body) => this.bodyIsland.set(body, islandId));
      islandId++;
    }

    this.profiler.end('World.integrate');
  }

  private detectCollisions() {
    this.profiler.begin('World.detectCollisions');

    for (const body of this.bodies) {
      this.bodyContacts.get(body).clear();
    }

    for (const contact of this.collisionDetector.detectCollisions()) {
      const joint = new ContactJoint(
        this,
        this.bodies[contact.bodyAIndex],
        this.bodies[contact.bodyBIndex],
        contact.point,
        contact.normal,
        contact.depth,
        this.friction
      );

      this.bodyContacts.get(this.bodies[contact.bodyAIndex]).add(joint);
      this.bodyContacts.get(this.bodies[contact.bodyBIndex]).add(joint);
    }

    this.profiler.end('World.detectCollisions');
  }

  private updateBodiesTransforms() {
    this.profiler.begin('World.updateBodiesTransforms');
    this.bodies.forEach((b) => b.updateTransform());
    this.profiler.end('World.updateBodiesTransforms');
  }
}
